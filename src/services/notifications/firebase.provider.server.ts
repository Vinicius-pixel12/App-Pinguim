/**
 * Provider de push — Firebase Cloud Messaging (HTTP v1).
 *
 * Implementação compatível com o runtime edge (Cloudflare Worker):
 * o JWT da service account é assinado com WebCrypto (RS256) e trocado por um
 * access token OAuth2. `firebase-admin` NÃO roda neste runtime.
 */

import { ServiceError } from "../core/errors";
import { requireEnv, optionalEnv } from "../core/env.server";
import type { DeviceToken, PushMessage, PushService } from "./types";

export const FCM_MAX_TOKENS_PER_BATCH = 500;

const FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";

export function isFirebaseConfigured() {
  return (
    !!optionalEnv("FIREBASE_PROJECT_ID") &&
    !!optionalEnv("FIREBASE_CLIENT_EMAIL") &&
    !!optionalEnv("FIREBASE_PRIVATE_KEY")
  );
}

function base64url(input: ArrayBuffer | string) {
  const bytes =
    typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToArrayBuffer(pem: string) {
  const body = pem
    .replace(/\\n/g, "\n")
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const binary = atob(body);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf.buffer;
}

let cachedToken: { value: string; expiresAt: number } | undefined;

/** Access token OAuth2 da service account (cacheado até ~5 min do fim). */
export async function getFcmAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const clientEmail = requireEnv("firebase", "FIREBASE_CLIENT_EMAIL");
  const privateKey = requireEnv("firebase", "FIREBASE_PRIVATE_KEY");

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(
    JSON.stringify({
      iss: clientEmail,
      scope: FCM_SCOPE,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(`${header}.${claim}`),
  );
  const assertion = `${header}.${claim}.${base64url(signature)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!res.ok || !json.access_token) {
    throw new ServiceError("firebase", `Falha ao autenticar no FCM: ${res.status}`, "auth_failed");
  }

  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
  return cachedToken.value;
}

type SendResult = { sent: number; failed: number; invalidTokens: string[] };

/** Envia a mesma mensagem para uma lista de tokens (um request por token, em lotes). */
export async function sendToTokens(
  tokens: string[],
  message: PushMessage,
): Promise<SendResult> {
  if (tokens.length === 0) return { sent: 0, failed: 0, invalidTokens: [] };

  const projectId = requireEnv("firebase", "FIREBASE_PROJECT_ID");
  const accessToken = await getFcmAccessToken();
  const endpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  const result: SendResult = { sent: 0, failed: 0, invalidTokens: [] };

  for (let i = 0; i < tokens.length; i += FCM_MAX_TOKENS_PER_BATCH) {
    const batch = tokens.slice(i, i + FCM_MAX_TOKENS_PER_BATCH);
    await Promise.all(
      batch.map(async (token) => {
        const body = {
          message: {
            token,
            notification: {
              title: message.title,
              body: message.body,
              ...(message.imageUrl ? { image: message.imageUrl } : {}),
            },
            data: {
              template: message.template,
              ...(message.clickPath ? { clickPath: message.clickPath } : {}),
              ...(message.data ?? {}),
            },
            webpush: {
              fcmOptions: message.clickPath ? { link: message.clickPath } : undefined,
            },
          },
        };
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            authorization: `Bearer ${accessToken}`,
            "content-type": "application/json",
          },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          result.sent += 1;
          return;
        }
        result.failed += 1;
        const text = await res.text();
        if (res.status === 404 || /UNREGISTERED|INVALID_ARGUMENT/i.test(text)) {
          result.invalidTokens.push(token);
        } else {
          console.error(`[firebase] envio falhou [${res.status}]: ${text}`);
        }
      }),
    );
  }

  return result;
}

export function createFirebasePushService(): PushService {
  const tokensOf = async (userIds: string[]) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("device_tokens")
      .select("token")
      .in("user_id", userIds);
    if (error) throw new ServiceError("firebase", error.message, "tokens_query_failed");
    return (data ?? []).map((r) => r.token);
  };

  const prune = async (tokens: string[]) => {
    if (tokens.length === 0) return;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("device_tokens").delete().in("token", tokens);
  };

  const send = async (userIds: string[], message: PushMessage) => {
    if (!isFirebaseConfigured()) return { sent: 0, failed: 0 };
    const tokens = await tokensOf(userIds);
    const res = await sendToTokens(tokens, message);
    await prune(res.invalidTokens);
    return { sent: res.sent, failed: res.failed };
  };

  return {
    async registerToken(input: Omit<DeviceToken, "createdAt">): Promise<void> {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin
        .from("device_tokens")
        .upsert(
          { user_id: input.userId, token: input.token, platform: input.platform },
          { onConflict: "token" },
        );
      if (error) throw new ServiceError("firebase", error.message, "register_failed");
    },
    async unregisterToken(token: string): Promise<void> {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("device_tokens").delete().eq("token", token);
    },
    sendToUser: (userId, message) => send([userId], message),
    sendToUsers: (userIds, message) => send(userIds, message),
    async sendToTopic(topic: string, message: PushMessage): Promise<void> {
      const projectId = requireEnv("firebase", "FIREBASE_PROJECT_ID");
      const accessToken = await getFcmAccessToken();
      const res = await fetch(
        `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${accessToken}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            message: {
              topic,
              notification: { title: message.title, body: message.body },
              data: { template: message.template, ...(message.data ?? {}) },
            },
          }),
        },
      );
      if (!res.ok) {
        throw new ServiceError("firebase", `Falha no envio para tópico: ${await res.text()}`);
      }
    },
  };
}

/**
 * Registro do token de push no navegador (Firebase Cloud Messaging).
 * Só roda no cliente e é totalmente opcional: se as chaves públicas do
 * Firebase não estiverem configuradas, tudo vira no-op silencioso.
 */

import { publicEnv } from "@/services/core/public-env";
import { registerDeviceToken, unregisterDeviceToken } from "./push.functions";

const STORAGE_KEY = "pinguim:fcm-token";

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    !!publicEnv.firebase.apiKey &&
    !!publicEnv.firebase.projectId &&
    !!publicEnv.firebase.appId &&
    !!publicEnv.firebase.vapidKey
  );
}

/** Pede permissão, obtém o token FCM e registra no backend. */
export async function enablePush(): Promise<
  { ok: true; token: string } | { ok: false; reason: string }
> {
  if (!isPushSupported()) return { ok: false, reason: "unsupported" };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: "denied" };

  const { initializeApp, getApps } = await import("firebase/app");
  const { getMessaging, getToken, isSupported } = await import("firebase/messaging");
  if (!(await isSupported())) return { ok: false, reason: "unsupported" };

  const app =
    getApps()[0] ??
    initializeApp({
      apiKey: publicEnv.firebase.apiKey!,
      projectId: publicEnv.firebase.projectId!,
      appId: publicEnv.firebase.appId!,
      messagingSenderId: publicEnv.firebase.messagingSenderId,
      storageBucket: `${publicEnv.firebase.projectId}.appspot.com`,
    });

  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  await navigator.serviceWorker.ready;
  registration.active?.postMessage({
    firebaseConfig: {
      apiKey: publicEnv.firebase.apiKey,
      projectId: publicEnv.firebase.projectId,
      appId: publicEnv.firebase.appId,
      messagingSenderId: publicEnv.firebase.messagingSenderId,
    },
  });
  const token = await getToken(getMessaging(app), {
    vapidKey: publicEnv.firebase.vapidKey!,
    serviceWorkerRegistration: registration,
  });
  if (!token) return { ok: false, reason: "no_token" };

  await registerDeviceToken({ data: { token, platform: "web" } });
  localStorage.setItem(STORAGE_KEY, token);
  return { ok: true, token };
}

/** Remove o token deste aparelho (chamado no logout). */
export async function disablePush() {
  const token = localStorage.getItem(STORAGE_KEY);
  if (!token) return;
  localStorage.removeItem(STORAGE_KEY);
  try {
    await unregisterDeviceToken({ data: { token } });
  } catch {
    /* silencioso */
  }
}

/**
 * Webhook interno de push: chamado pelo banco (pg_net) a cada nova notificação.
 * Protegido por um segredo compartilhado (header x-push-secret).
 */

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import type { PushMessage, PushTemplate } from "@/services/notifications/types";

const bodySchema = z.object({ notification_id: z.string().uuid() });

const TEMPLATES: Record<string, PushTemplate> = {
  follow: "new_follower",
  follow_request: "new_follower",
  post_like: "new_message",
  comment_like: "new_message",
  post_comment: "new_message",
  comment: "new_message",
  new_message: "new_message",
  conversation_request: "conversation_request",
  conversation_accepted: "conversation_accepted",
  conversation_rejected: "conversation_rejected",
  kyc_result: "kyc_result",
  withdraw_status: "withdraw_status",
};

const CLICK_PATHS: Record<string, string> = {
  new_message: "/conversas",
  conversation_request: "/notificacoes",
  conversation_accepted: "/conversas",
  conversation_rejected: "/notificacoes",
};

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const Route = createFileRoute("/api/public/webhooks/push")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.PUSH_WEBHOOK_SECRET;
        const provided = request.headers.get("x-push-secret") ?? "";
        if (!secret || !timingSafeEqual(provided, secret)) {
          return new Response("Unauthorized", { status: 401 });
        }

        const parsed = bodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Invalid body", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: notification, error } = await supabaseAdmin
          .from("notifications")
          .select("id, user_id, type, title, body")
          .eq("id", parsed.data.notification_id)
          .maybeSingle();
        if (error || !notification) return new Response("Not found", { status: 404 });

        const { createFirebasePushService, isFirebaseConfigured } = await import(
          "@/services/notifications/firebase.provider.server"
        );
        if (!isFirebaseConfigured()) return Response.json({ skipped: "not_configured" });

        const message: PushMessage = {
          template: TEMPLATES[notification.type] ?? "new_message",
          title: notification.title,
          body: notification.body ?? "",
          clickPath: CLICK_PATHS[notification.type] ?? "/notificacoes",
          data: { notificationId: notification.id, type: notification.type },
        };

        const result = await createFirebasePushService().sendToUser(
          notification.user_id,
          message,
        );
        return Response.json(result);
      },
    },
  },
});

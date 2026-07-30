/**
 * Server functions de push (Firebase Cloud Messaging).
 * Thin wrappers: providers carregados dentro do handler.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const registerSchema = z.object({
  token: z.string().min(20).max(4096),
  platform: z.enum(["web", "ios", "android"]).default("web"),
});

/** Diagnóstico: o Firebase está configurado neste ambiente? */
export const getPushStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { isFirebaseConfigured } = await import(
    "@/services/notifications/firebase.provider.server"
  );
  return { configured: isFirebaseConfigured() };
});

/** Registra (ou atualiza) o token FCM do aparelho do usuário autenticado. */
export const registerDeviceToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => registerSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { createFirebasePushService } = await import(
      "@/services/notifications/firebase.provider.server"
    );
    await createFirebasePushService().registerToken({
      userId: context.userId,
      token: data.token,
      platform: data.platform,
    });
    return { ok: true };
  });

/** Remove o token do aparelho (logout / revogação de permissão). */
export const unregisterDeviceToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ token: z.string().min(20) }).parse(input))
  .handler(async ({ data }) => {
    const { createFirebasePushService } = await import(
      "@/services/notifications/firebase.provider.server"
    );
    await createFirebasePushService().unregisterToken(data.token);
    return { ok: true };
  });

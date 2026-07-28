/**
 * Acesso tipado às variáveis de ambiente do servidor.
 *
 * REGRAS
 * - Nunca importe este arquivo de componentes/rotas: é server-only (*.server.ts).
 * - Leia sempre DENTRO de um handler (createServerFn / server route), nunca no
 *   escopo de módulo — a injeção de env acontece em tempo de requisição.
 * - Variáveis públicas do browser vivem em `src/services/core/public-env.ts`.
 */

import { ServiceError, type ServiceName } from "./errors";

export type ServerEnvKey =
  // Supabase (gerenciado pelo Lovable Cloud)
  | "SUPABASE_URL"
  | "SUPABASE_PUBLISHABLE_KEY"
  | "SUPABASE_SERVICE_ROLE_KEY"
  // Cloudflare R2 (armazenamento de mídia)
  | "R2_ACCOUNT_ID"
  | "R2_ACCESS_KEY_ID"
  | "R2_SECRET_ACCESS_KEY"
  | "R2_BUCKET_MEDIA"
  | "R2_BUCKET_KYC"
  | "R2_PUBLIC_BASE_URL"
  // Cloudflare CDN / Images / Stream
  | "CLOUDFLARE_API_TOKEN"
  | "CLOUDFLARE_ZONE_ID"
  | "CDN_BASE_URL"
  | "CDN_SIGNING_KEY"
  // CAF (KYC / biometria facial)
  | "CAF_API_URL"
  | "CAF_API_KEY"
  | "CAF_TEMPLATE_ID"
  | "CAF_WEBHOOK_SECRET"
  // Firebase (push notifications / FCM)
  | "FIREBASE_PROJECT_ID"
  | "FIREBASE_CLIENT_EMAIL"
  | "FIREBASE_PRIVATE_KEY"
  // Pipeline de mídia (FFmpeg roda fora do Worker)
  | "MEDIA_WORKER_URL"
  | "MEDIA_WORKER_SECRET";

/** Lê a variável ou lança um erro de serviço legível. */
export function requireEnv(service: ServiceName, key: ServerEnvKey): string {
  const value = process.env[key];
  if (!value) {
    throw new ServiceError(
      service,
      `Variável de ambiente ausente: ${key}. Configure-a nos secrets do projeto.`,
      "missing_env",
    );
  }
  return value;
}

/** Lê a variável sem lançar (para recursos opcionais). */
export function optionalEnv(key: ServerEnvKey): string | undefined {
  return process.env[key] || undefined;
}

/** Diagnóstico: quais integrações estão configuradas neste ambiente. */
export function integrationStatus() {
  const has = (...keys: ServerEnvKey[]) => keys.every((k) => !!process.env[k]);
  return {
    supabase: has("SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY"),
    r2: has("R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_MEDIA"),
    cdn: has("CDN_BASE_URL"),
    caf: has("CAF_API_URL", "CAF_API_KEY"),
    firebase: has("FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"),
    media: has("MEDIA_WORKER_URL", "MEDIA_WORKER_SECRET"),
  };
}

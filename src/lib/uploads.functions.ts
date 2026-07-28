/**
 * Server functions de upload de imagem (Cloudflare R2).
 *
 * O cliente pede uma URL pré-assinada e envia o arquivo direto para o R2 —
 * o Worker nunca recebe os bytes.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
const MAX_BYTES = 10 * 1024 * 1024;

const inputSchema = z.object({
  kind: z.enum(["avatar", "post", "story", "background"]),
  contentType: z.enum(ALLOWED),
  contentLength: z.number().int().positive().max(MAX_BYTES),
});

function extFor(contentType: string) {
  return contentType === "image/jpeg"
    ? "jpg"
    : contentType === "image/png"
      ? "png"
      : contentType === "image/webp"
        ? "webp"
        : "gif";
}

/** Diagnóstico público: o R2 está configurado neste ambiente? */
export const getStorageStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { isR2Configured } = await import("@/services/storage/r2.provider.server");
  return { configured: isR2Configured() };
});

export const createImageUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { createR2StorageService, isR2Configured } = await import(
      "@/services/storage/r2.provider.server"
    );
    if (!isR2Configured()) {
      throw new Error(
        "Armazenamento de imagens indisponível: configure as credenciais do Cloudflare R2.",
      );
    }
    const storage = createR2StorageService();
    const key = `${data.kind}s/${context.userId}/${crypto.randomUUID()}.${extFor(data.contentType)}`;
    const upload = await storage.createUploadUrl({
      bucket: "media",
      key,
      contentType: data.contentType,
      contentLength: data.contentLength,
      metadata: { userId: context.userId },
    });
    return { ...upload, publicUrl: storage.publicUrl("media", key) };
  });

import { createImageUploadUrl } from "@/lib/uploads.functions";
import { compressMedia } from "@/lib/media-compress";

export type UploadKind = "avatar" | "post" | "story" | "background";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

/** Lê o arquivo como data URL (fallback local quando o R2 não está configurado). */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Valida tipo/tamanho antes de pedir a URL assinada. Devolve mensagem de erro ou null. */
export function validateMediaFile(file: File): string | null {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
  if (!isImage && !isVideo) return "Formato não suportado. Use JPG, PNG, WEBP, GIF, MP4, MOV ou WEBM.";
  if (isImage && file.size > MAX_IMAGE_BYTES) return "Imagem acima do limite de 10 MB.";
  if (isVideo && file.size > MAX_VIDEO_BYTES) return "Vídeo acima do limite de 200 MB.";
  return null;
}

export type UploadOptions = {
  /** Corta o vídeo neste limite (stories: 10s). */
  maxSeconds?: number;
  /** Progresso da compressão do vídeo (0..1). */
  onCompressProgress?: (ratio: number) => void;
  /** Desliga a compressão automática. */
  skipCompression?: boolean;
};

/**
 * Comprime a mídia automaticamente (canvas para imagens, FFmpeg/WASM para
 * vídeos) e envia direto para o Cloudflare R2 via URL pré-assinada,
 * devolvendo a URL pública (CDN).
 */
export async function uploadMedia(
  file: File,
  kind: UploadKind,
  options: UploadOptions = {},
): Promise<string> {
  const invalid = validateMediaFile(file);
  if (invalid) throw new Error(invalid);

  const final = options.skipCompression
    ? file
    : (
        await compressMedia(file, {
          maxSeconds: options.maxSeconds,
          onProgress: options.onCompressProgress,
        })
      ).file;

  const stillInvalid = validateMediaFile(final);
  if (stillInvalid) throw new Error(stillInvalid);

  const upload = await createImageUploadUrl({
    data: {
      kind,
      contentType: final.type as "image/jpeg",
      contentLength: final.size,
    },
  });

  const res = await fetch(upload.url, {
    method: upload.method,
    headers: upload.headers,
    body: final,
  });
  if (!res.ok) throw new Error(`Falha no upload para o R2 (${res.status})`);
  return upload.publicUrl;
}


/** Alias histórico — imagens. */
export const uploadImage = uploadMedia;

/** Upload com fallback: usa R2 quando disponível, senão data URL local. */
export async function uploadImageWithFallback(
  file: File,
  kind: UploadKind,
): Promise<{ url: string; remote: boolean }> {
  try {
    return { url: await uploadMedia(file, kind), remote: true };
  } catch {
    return { url: await fileToDataUrl(file), remote: false };
  }
}

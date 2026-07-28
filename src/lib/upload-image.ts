import { createImageUploadUrl } from "@/lib/uploads.functions";

export type UploadKind = "avatar" | "post" | "story" | "background";

/** Lê o arquivo como data URL (fallback local quando o R2 não está configurado). */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Envia a imagem direto para o Cloudflare R2 via URL pré-assinada e devolve a
 * URL pública (CDN). Lança se o R2 não estiver configurado ou o envio falhar.
 */
export async function uploadImage(file: File, kind: UploadKind): Promise<string> {
  const upload = await createImageUploadUrl({
    data: {
      kind,
      contentType: file.type as "image/jpeg",
      contentLength: file.size,
    },
  });

  const res = await fetch(upload.url, {
    method: upload.method,
    headers: upload.headers,
    body: file,
  });
  if (!res.ok) throw new Error(`Falha no upload para o R2 (${res.status})`);
  return upload.publicUrl;
}

/** Upload com fallback: usa R2 quando disponível, senão data URL local. */
export async function uploadImageWithFallback(
  file: File,
  kind: UploadKind,
): Promise<{ url: string; remote: boolean }> {
  try {
    return { url: await uploadImage(file, kind), remote: true };
  } catch {
    return { url: await fileToDataUrl(file), remote: false };
  }
}

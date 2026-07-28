/**
 * Contrato de armazenamento de objetos (implementação alvo: Cloudflare R2).
 * Client-safe: apenas tipos.
 */

/** Buckets lógicos — mapeados para buckets físicos via env. */
export type StorageBucket = "media" | "kyc";

export type StorageKey = string; // ex.: "posts/{userId}/{postId}/original.jpg"

export type UploadIntent = {
  bucket: StorageBucket;
  key: StorageKey;
  contentType: string;
  contentLength: number;
  /** Metadados livres gravados no objeto. */
  metadata?: Record<string, string>;
};

export type PresignedUpload = {
  url: string;
  method: "PUT" | "POST";
  headers: Record<string, string>;
  key: StorageKey;
  expiresAt: string; // ISO
};

export type SignedDownload = {
  url: string;
  expiresAt: string; // ISO
};

export type StoredObject = {
  key: StorageKey;
  size: number;
  contentType: string;
  etag: string;
  uploadedAt: string; // ISO
};

export interface StorageService {
  /** Gera URL assinada para upload direto do cliente (não passa pelo servidor). */
  createUploadUrl(intent: UploadIntent): Promise<PresignedUpload>;
  /** URL assinada de leitura para conteúdo privado (ex.: documentos de KYC). */
  createDownloadUrl(
    bucket: StorageBucket,
    key: StorageKey,
    ttlSeconds?: number,
  ): Promise<SignedDownload>;
  /** URL pública/CDN para conteúdo aberto (posts, avatares). */
  publicUrl(bucket: StorageBucket, key: StorageKey): string;
  head(bucket: StorageBucket, key: StorageKey): Promise<StoredObject | null>;
  delete(bucket: StorageBucket, keys: StorageKey[]): Promise<void>;
  /** Cópia server-side (ex.: mover derivado do temp para o definitivo). */
  copy(
    from: { bucket: StorageBucket; key: StorageKey },
    to: { bucket: StorageBucket; key: StorageKey },
  ): Promise<void>;
}

/** Convenções de chave — centralizadas para evitar strings soltas. */
export const storageKeys = {
  avatar: (userId: string, ext: string) => `avatars/${userId}/avatar.${ext}`,
  postOriginal: (userId: string, postId: string, ext: string) =>
    `posts/${userId}/${postId}/original.${ext}`,
  postRendition: (userId: string, postId: string, variant: string) =>
    `posts/${userId}/${postId}/${variant}`,
  storyOriginal: (userId: string, storyId: string, ext: string) =>
    `stories/${userId}/${storyId}/original.${ext}`,
  kycDocument: (userId: string, kind: "selfie" | "document", ext: string) =>
    `kyc/${userId}/${kind}.${ext}`,
} as const;

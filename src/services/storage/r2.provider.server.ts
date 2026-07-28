/**
 * Provider de armazenamento — Cloudflare R2 (S3-compatible).
 *
 * STATUS: scaffold. Nenhuma chamada real implementada.
 *
 * PONTOS DE INTEGRAÇÃO (quando for implementar):
 * - Endpoint S3: https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com
 * - Assinatura SigV4 (usar `aws4fetch`, compatível com Cloudflare Workers;
 *   NÃO usar @aws-sdk/client-s3, é pesado demais para o runtime edge).
 * - Uploads sempre diretos do cliente via URL pré-assinada (nunca proxy pelo
 *   Worker) — requisito para escalar a 1M de usuários.
 * - Leitura pública sempre pelo CDN, nunca pelo domínio r2.cloudflarestorage.com.
 */

import { NotImplementedError } from "../core/errors";
import { requireEnv } from "../core/env.server";
import type {
  PresignedUpload,
  SignedDownload,
  StorageBucket,
  StorageKey,
  StorageService,
  StoredObject,
  UploadIntent,
} from "./types";

function physicalBucket(bucket: StorageBucket): string {
  return bucket === "kyc"
    ? requireEnv("r2", "R2_BUCKET_KYC")
    : requireEnv("r2", "R2_BUCKET_MEDIA");
}

export function createR2StorageService(): StorageService {
  return {
    async createUploadUrl(_intent: UploadIntent): Promise<PresignedUpload> {
      throw new NotImplementedError("r2", "createUploadUrl");
    },
    async createDownloadUrl(
      _bucket: StorageBucket,
      _key: StorageKey,
      _ttlSeconds = 300,
    ): Promise<SignedDownload> {
      throw new NotImplementedError("r2", "createDownloadUrl");
    },
    publicUrl(bucket: StorageBucket, key: StorageKey): string {
      if (bucket === "kyc") {
        throw new NotImplementedError("r2", "publicUrl(kyc) — conteúdo privado");
      }
      const base = requireEnv("r2", "R2_PUBLIC_BASE_URL").replace(/\/$/, "");
      return `${base}/${key}`;
    },
    async head(_bucket: StorageBucket, _key: StorageKey): Promise<StoredObject | null> {
      throw new NotImplementedError("r2", "head");
    },
    async delete(_bucket: StorageBucket, _keys: StorageKey[]): Promise<void> {
      throw new NotImplementedError("r2", "delete");
    },
    async copy(): Promise<void> {
      throw new NotImplementedError("r2", "copy");
    },
  };
}

/** Exposto para uso futuro nos handlers de assinatura SigV4. */
export const r2Internals = { physicalBucket };

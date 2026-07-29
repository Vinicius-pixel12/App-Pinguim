/**
 * Provider de armazenamento — Cloudflare R2 (S3-compatible).
 *
 * Uploads são sempre diretos do cliente via URL pré-assinada (SigV4 na query
 * string, assinada com `aws4fetch` — compatível com o runtime edge).
 * Leitura pública sempre pelo domínio de CDN configurado em R2_PUBLIC_BASE_URL.
 */

import { AwsClient } from "aws4fetch";

import { ServiceError, NotImplementedError } from "../core/errors";
import { requireEnv, optionalEnv } from "../core/env.server";
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

function endpoint(): string {
  return `https://${requireEnv("r2", "R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`;
}

function client(): AwsClient {
  return new AwsClient({
    accessKeyId: requireEnv("r2", "R2_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("r2", "R2_SECRET_ACCESS_KEY"),
    service: "s3",
    region: "auto",
  });
}

function objectUrl(bucket: StorageBucket, key: StorageKey): string {
  return `${endpoint()}/${physicalBucket(bucket)}/${key.replace(/^\/+/, "")}`;
}

async function presign(
  method: "PUT" | "GET",
  bucket: StorageBucket,
  key: StorageKey,
  ttlSeconds: number,
): Promise<string> {
  const url = new URL(objectUrl(bucket, key));
  url.searchParams.set("X-Amz-Expires", String(ttlSeconds));
  const signed = await client().sign(new Request(url, { method }), {
    aws: { signQuery: true },
  });
  return signed.url;
}

/** Indica se as variáveis mínimas do R2 estão presentes neste ambiente. */
export function isR2Configured(): boolean {
  return (
    !!optionalEnv("R2_ACCOUNT_ID") &&
    !!optionalEnv("R2_ACCESS_KEY_ID") &&
    !!optionalEnv("R2_SECRET_ACCESS_KEY") &&
    !!optionalEnv("R2_BUCKET_MEDIA") &&
    !!optionalEnv("R2_PUBLIC_BASE_URL")
  );
}

export function createR2StorageService(): StorageService {
  return {
    async createUploadUrl(intent: UploadIntent): Promise<PresignedUpload> {
      const ttl = 600;
      const url = await presign("PUT", intent.bucket, intent.key, ttl);
      return {
        url,
        method: "PUT",
        headers: { "content-type": intent.contentType },
        key: intent.key,
        expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
      };
    },
    async createDownloadUrl(
      bucket: StorageBucket,
      key: StorageKey,
      ttlSeconds = 300,
    ): Promise<SignedDownload> {
      const url = await presign("GET", bucket, key, ttlSeconds);
      return { url, expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString() };
    },
    publicUrl(bucket: StorageBucket, key: StorageKey): string {
      if (bucket === "kyc") {
        throw new NotImplementedError("r2", "publicUrl(kyc) — conteúdo privado");
      }
      const raw = requireEnv("r2", "R2_PUBLIC_BASE_URL").trim().replace(/\/$/, "");
      const base = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
      return `${base}/${key.replace(/^\/+/, "")}`;
    },
    async head(bucket: StorageBucket, key: StorageKey): Promise<StoredObject | null> {
      const res = await client().fetch(objectUrl(bucket, key), { method: "HEAD" });
      if (res.status === 404) return null;
      if (!res.ok) {
        throw new ServiceError("r2", `Falha ao consultar objeto (${res.status})`, "head_failed");
      }
      return {
        key,
        size: Number(res.headers.get("content-length") ?? 0),
        contentType: res.headers.get("content-type") ?? "application/octet-stream",
        etag: res.headers.get("etag") ?? "",
        uploadedAt: res.headers.get("last-modified") ?? new Date().toISOString(),
      };
    },
    async delete(bucket: StorageBucket, keys: StorageKey[]): Promise<void> {
      const aws = client();
      for (const key of keys) {
        const res = await aws.fetch(objectUrl(bucket, key), { method: "DELETE" });
        if (!res.ok && res.status !== 404) {
          throw new ServiceError("r2", `Falha ao remover ${key} (${res.status})`, "delete_failed");
        }
      }
    },
    async copy(from, to): Promise<void> {
      const res = await client().fetch(objectUrl(to.bucket, to.key), {
        method: "PUT",
        headers: {
          "x-amz-copy-source": `/${physicalBucket(from.bucket)}/${from.key.replace(/^\/+/, "")}`,
        },
      });
      if (!res.ok) {
        throw new ServiceError("r2", `Falha ao copiar objeto (${res.status})`, "copy_failed");
      }
    },
  };
}

/** Exposto para uso futuro nos handlers de assinatura SigV4. */
export const r2Internals = { physicalBucket, objectUrl };

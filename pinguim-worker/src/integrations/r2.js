/**
 * Cloudflare R2 — scaffold.
 * Implementar com @aws-sdk/client-s3 (endpoint https://<account>.r2.cloudflarestorage.com).
 * Segredos lidos aqui dentro, nunca no topo do módulo.
 */

import { requireEnv } from "../config.js";

export function r2Config() {
  return {
    accountId: requireEnv("R2_ACCOUNT_ID"),
    accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    buckets: {
      media: requireEnv("R2_BUCKET_MEDIA"),
      kyc: process.env.R2_BUCKET_KYC ?? "",
    },
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL ?? "",
  };
}

export async function downloadToFile(_bucket, _key, _destPath) {
  throw new Error("[r2] downloadToFile ainda não implementado");
}

export async function uploadFile(_bucket, _key, _filePath, _contentType) {
  throw new Error("[r2] uploadFile ainda não implementado");
}

export async function deleteObjects(_bucket, _keys) {
  throw new Error("[r2] deleteObjects ainda não implementado");
}

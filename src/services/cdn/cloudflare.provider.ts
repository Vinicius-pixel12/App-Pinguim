/**
 * Provider de CDN — Cloudflare.
 *
 * STATUS: scaffold. Montagem de URL já é pura (pode rodar no client);
 * assinatura e purge exigem token e ficam server-side quando implementados.
 *
 * PONTOS DE INTEGRAÇÃO:
 * - Image Resizing: /cdn-cgi/image/{opts}/{origem}
 * - Purge: POST /client/v4/zones/{CLOUDFLARE_ZONE_ID}/purge_cache (server-only)
 * - Signed URLs: HMAC com CDN_SIGNING_KEY validado por um Worker na borda
 */

import { NotImplementedError } from "../core/errors";
import { publicEnv } from "../core/public-env";
import type { CdnService, ImageTransform, VideoVariant } from "./types";

function serializeTransform(t: ImageTransform): string {
  const parts: string[] = [];
  if (t.width) parts.push(`width=${t.width}`);
  if (t.height) parts.push(`height=${t.height}`);
  if (t.quality) parts.push(`quality=${t.quality}`);
  if (t.fit) parts.push(`fit=${t.fit}`);
  parts.push(`format=${t.format ?? "auto"}`);
  return parts.join(",");
}

export function createCloudflareCdnService(baseUrl?: string): CdnService {
  const base = (baseUrl ?? publicEnv.cdnBaseUrl ?? "").replace(/\/$/, "");

  return {
    imageUrl(key, transform) {
      const path = key.replace(/^\//, "");
      if (!transform) return `${base}/${path}`;
      return `${base}/cdn-cgi/image/${serializeTransform(transform)}/${path}`;
    },
    videoUrl(key: string, variant: VideoVariant) {
      const path = key.replace(/^\//, "").replace(/\/[^/]+$/, "");
      const file =
        variant === "hls"
          ? "index.m3u8"
          : variant === "thumbnail"
            ? "thumb.jpg"
            : `${variant}.mp4`;
      return `${base}/${path}/${file}`;
    },
    async signedUrl() {
      throw new NotImplementedError("cdn", "signedUrl");
    },
    async purge() {
      throw new NotImplementedError("cdn", "purge");
    },
  };
}

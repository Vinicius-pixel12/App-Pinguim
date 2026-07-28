/**
 * Contrato de CDN / entrega de mídia (implementação alvo: Cloudflare CDN).
 * Client-safe: apenas tipos + helpers puros.
 */

export type ImageTransform = {
  width?: number;
  height?: number;
  quality?: number; // 1-100
  format?: "auto" | "webp" | "avif" | "jpeg";
  fit?: "cover" | "contain" | "scale-down";
};

export type VideoVariant = "hls" | "mp4-720p" | "mp4-480p" | "thumbnail";

export interface CdnService {
  /** URL final para uma imagem, com transformações aplicadas na borda. */
  imageUrl(key: string, transform?: ImageTransform): string;
  /** URL final para um derivado de vídeo. */
  videoUrl(key: string, variant: VideoVariant): string;
  /** URL assinada com expiração (conteúdo restrito a seguidores/pagantes). */
  signedUrl(key: string, ttlSeconds: number): Promise<string>;
  /** Invalidação de cache após edição/remoção de mídia. */
  purge(keys: string[]): Promise<void>;
}

/** Presets usados pela UI — evita números mágicos espalhados. */
export const imagePresets = {
  avatarSm: { width: 64, height: 64, fit: "cover", format: "auto" },
  avatarLg: { width: 200, height: 200, fit: "cover", format: "auto" },
  gridThumb: { width: 400, height: 400, fit: "cover", format: "auto" },
  feed: { width: 1080, quality: 82, format: "auto" },
  story: { width: 1080, height: 1920, fit: "cover", format: "auto" },
} satisfies Record<string, ImageTransform>;

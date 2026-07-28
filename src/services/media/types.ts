/**
 * Contrato de processamento de mídia (implementação alvo: FFmpeg fora do Worker).
 * Client-safe: apenas tipos.
 *
 * IMPORTANTE: FFmpeg NÃO roda no runtime serverless deste app (sem
 * child_process, sem binários nativos). O contrato abaixo descreve um job
 * assíncrono despachado para um worker externo (container/fila), que lê e
 * grava no R2 e avisa o app por webhook.
 */

export type MediaJobKind =
  | "video_transcode" // mp4 720p/480p + HLS
  | "video_thumbnail" // frame de capa
  | "video_trim" // corte de stories em 10s
  | "image_optimize" // normalização/EXIF strip
  | "audio_extract";

export type MediaJobStatus = "queued" | "processing" | "done" | "failed";

export type MediaJobInput = {
  kind: MediaJobKind;
  /** Objeto de origem no R2. */
  sourceKey: string;
  /** Prefixo de destino no R2 para os derivados. */
  outputPrefix: string;
  ownerId: string;
  options?: {
    maxDurationSeconds?: number; // stories: 10
    renditions?: Array<"720p" | "480p" | "hls">;
    thumbnailAtSeconds?: number;
    maxWidth?: number;
  };
};

export type MediaJob = {
  id: string;
  status: MediaJobStatus;
  kind: MediaJobKind;
  outputs: Array<{ variant: string; key: string; bytes?: number }>;
  durationSeconds?: number;
  width?: number;
  height?: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
};

export type MediaWebhookEvent = {
  jobId: string;
  status: MediaJobStatus;
  outputs: MediaJob["outputs"];
  error?: string;
};

export interface MediaService {
  enqueue(input: MediaJobInput): Promise<MediaJob>;
  getJob(jobId: string): Promise<MediaJob | null>;
  cancel(jobId: string): Promise<void>;
  parseWebhook(rawBody: string, signature: string | null): Promise<MediaWebhookEvent>;
}

/** Regras de produto aplicadas antes de enfileirar. */
export const mediaLimits = {
  storyMaxSeconds: 10,
  postVideoMaxSeconds: 90,
  maxUploadBytes: 200 * 1024 * 1024,
  allowedImageTypes: ["image/jpeg", "image/png", "image/webp", "image/heic"],
  allowedVideoTypes: ["video/mp4", "video/quicktime", "video/webm"],
} as const;

/**
 * Provider de mídia — worker FFmpeg externo.
 *
 * STATUS: scaffold. Nenhuma chamada real implementada.
 *
 * ARQUITETURA ALVO:
 *   cliente → URL assinada R2 (upload direto)
 *          → server fn cria linha em media_jobs (status: queued)
 *          → POST {MEDIA_WORKER_URL}/jobs (auth: MEDIA_WORKER_SECRET)
 *          → worker FFmpeg lê do R2, transcodifica, grava derivados no R2
 *          → POST /api/public/webhooks/media (HMAC) atualiza media_jobs
 *          → app publica o post quando o job termina
 *
 * Nunca chamar FFmpeg dentro deste app: o runtime serverless não suporta
 * child_process nem binários nativos.
 */

import { NotImplementedError } from "../core/errors";
import type {
  MediaJob,
  MediaJobInput,
  MediaService,
  MediaWebhookEvent,
} from "./types";

export function createFfmpegMediaService(): MediaService {
  return {
    async enqueue(_input: MediaJobInput): Promise<MediaJob> {
      throw new NotImplementedError("ffmpeg", "enqueue");
    },
    async getJob(_jobId: string): Promise<MediaJob | null> {
      throw new NotImplementedError("ffmpeg", "getJob");
    },
    async cancel(_jobId: string): Promise<void> {
      throw new NotImplementedError("ffmpeg", "cancel");
    },
    async parseWebhook(_rawBody: string, _signature: string | null): Promise<MediaWebhookEvent> {
      throw new NotImplementedError("ffmpeg", "parseWebhook");
    },
  };
}

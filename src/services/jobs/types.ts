/**
 * Contratos da fila de tarefas (tabela `public.jobs`).
 * Client-safe: apenas tipos e constantes.
 *
 * ARQUITETURA
 *   Aplicativo (Lovable/TanStack)
 *        ↓ enqueueJob()
 *   Supabase (Postgres) — tabela `jobs`
 *        ↓ claim_jobs()  (polling do worker)
 *   Worker Node.js externo (Render/Fly/container)
 *        ├── FFmpeg (transcode, thumbnail, trim)
 *        ├── Firebase (push)
 *        ├── Cloudflare R2 (derivados de mídia)
 *        ├── Pagar.me (PIX / split / saques)
 *        ├── IA (moderação, legendas, edição de imagem)
 *        └── E-mails (transacionais)
 *        ↓ complete_job() / fail_job()
 *   Supabase atualiza o status → app reage (realtime/polling)
 *
 * Regra de ouro: nada pesado roda dentro do app (runtime serverless sem
 * child_process). Tudo vira um job.
 */

export type JobStatus = "pending" | "processing" | "done" | "failed" | "canceled";

/** Mapa tipo-de-job → payload esperado. Adicione novos tipos AQUI primeiro. */
export type JobPayloads = {
  // ── Mídia (FFmpeg + R2) ────────────────────────────────────────────────
  compress_video: {
    postId?: string;
    storyId?: string;
    userId: string;
    sourceKey: string;
    outputPrefix?: string;
    maxSeconds?: number;
    renditions?: Array<"720p" | "480p" | "hls">;
  };
  generate_thumbnail: { sourceKey: string; userId: string; atSeconds?: number };
  optimize_image: { sourceKey: string; userId: string; maxWidth?: number };
  purge_media: { keys: string[] };

  // ── Notificações ───────────────────────────────────────────────────────
  send_push: { userId: string; title: string; body: string; clickPath?: string };
  send_email: { to: string; template: string; data?: Record<string, unknown> };

  // ── Financeiro (Pagar.me) ──────────────────────────────────────────────
  pix_payment: { withdrawId: string; userId: string; amount: number };
  reconcile_payment: { paymentId: string };

  // ── KYC / IA ───────────────────────────────────────────────────────────
  face_match: { userId: string; selfieKey: string; documentKey: string };
  moderate_content: { postId?: string; storyId?: string; mediaUrl: string };
  ai_image_edit: { postId: string; userId: string; prompt: string };
};

export type JobType = keyof JobPayloads;

export type Job<T extends JobType = JobType> = {
  id: string;
  type: T;
  payload: JobPayloads[T];
  status: JobStatus;
  priority: number;
  attempts: number;
  maxAttempts: number;
  error: string | null;
  result: unknown;
  runAfter: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
};

/** Prioridade padrão por tipo (maior = processado antes). */
export const JOB_PRIORITY: Record<JobType, number> = {
  send_push: 100,
  pix_payment: 90,
  face_match: 80,
  send_email: 70,
  generate_thumbnail: 60,
  optimize_image: 50,
  compress_video: 40,
  moderate_content: 40,
  ai_image_edit: 30,
  reconcile_payment: 20,
  purge_media: 10,
};

/** Tentativas máximas por tipo (financeiro é conservador). */
export const JOB_MAX_ATTEMPTS: Record<JobType, number> = {
  send_push: 3,
  pix_payment: 3,
  face_match: 3,
  send_email: 5,
  generate_thumbnail: 5,
  optimize_image: 5,
  compress_video: 5,
  moderate_content: 3,
  ai_image_edit: 2,
  reconcile_payment: 10,
  purge_media: 5,
};

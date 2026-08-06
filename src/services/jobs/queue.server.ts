/**
 * Fila de tarefas — acesso server-side (service role).
 * Nunca importar de código de cliente.
 */

import type { Json } from "@/integrations/supabase/types";
import {
  JOB_MAX_ATTEMPTS,
  JOB_PRIORITY,
  type Job,
  type JobPayloads,
  type JobStatus,
  type JobType,
} from "./types";

type JobRow = {
  id: string;
  type: string;
  payload: Json;
  status: string;
  priority: number;
  attempts: number;
  max_attempts: number;
  error: string | null;
  result: Json;
  run_after: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
};

function toJob(row: JobRow): Job {
  return {
    id: row.id,
    type: row.type as JobType,
    payload: (row.payload ?? {}) as JobPayloads[JobType],
    status: row.status as JobStatus,
    priority: row.priority,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    error: row.error,
    result: row.result,
    runAfter: row.run_after,
    createdAt: row.created_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}

/** Enfileira uma tarefa para o worker externo. Retorna o id do job. */
export async function enqueueJob<T extends JobType>(
  type: T,
  payload: JobPayloads[T],
  options: { priority?: number; runAfter?: Date; maxAttempts?: number } = {},
): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("enqueue_job", {
    _type: type,
    _payload: payload as unknown as Json,
    _priority: options.priority ?? JOB_PRIORITY[type] ?? 0,
    _run_after: (options.runAfter ?? new Date()).toISOString(),
    _max_attempts: options.maxAttempts ?? JOB_MAX_ATTEMPTS[type] ?? 5,
  });
  if (error) throw new Error(`Falha ao enfileirar job ${type}: ${error.message}`);
  return data as string;
}

/** Worker reserva o próximo lote (lock atômico, SKIP LOCKED). */
export async function claimJobs(
  worker: string,
  limit = 1,
  types?: JobType[],
): Promise<Job[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("claim_jobs", {
    _worker: worker,
    _limit: limit,
    _types: types ?? undefined,
  });
  if (error) throw new Error(`Falha ao reservar jobs: ${error.message}`);
  return ((data ?? []) as unknown as JobRow[]).map(toJob);
}

export async function completeJob(jobId: string, result?: unknown): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.rpc("complete_job", {
    _job_id: jobId,
    _result: (result ?? null) as Json,
  });
  if (error) throw new Error(`Falha ao concluir job: ${error.message}`);
}

export async function failJob(jobId: string, message: string, retry = true): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.rpc("fail_job", {
    _job_id: jobId,
    _error: message.slice(0, 2000),
    _retry: retry,
  });
  if (error) throw new Error(`Falha ao registrar erro do job: ${error.message}`);
}

export async function requeueStalledJobs(olderThan = "10 minutes"): Promise<number> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("requeue_stalled_jobs", {
    _older_than: olderThan,
  });
  if (error) throw new Error(`Falha ao requeue de jobs: ${error.message}`);
  return (data ?? 0) as number;
}

/** Compara segredos em tempo constante. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Autentica o worker externo pelo header x-worker-secret. */
export function isAuthorizedWorker(request: Request): boolean {
  const secret = process.env.JOBS_WORKER_SECRET;
  const provided = request.headers.get("x-worker-secret") ?? "";
  return Boolean(secret) && timingSafeEqual(provided, secret!);
}

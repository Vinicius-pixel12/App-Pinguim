/** Acesso à fila `public.jobs` via funções SQL (claim/complete/fail). */

import { supabase } from "./supabase.js";
import { config } from "./config.js";

/** Reserva atômica do próximo lote (FOR UPDATE SKIP LOCKED no banco). */
export async function claimJobs(limit = 1, types = []) {
  const { data, error } = await supabase.rpc("claim_jobs", {
    _worker: config.worker.name,
    _limit: limit,
    _types: types.length ? types : null,
  });
  if (error) throw new Error(`claim_jobs falhou: ${error.message}`);
  return data ?? [];
}

export async function completeJob(jobId, result) {
  const { error } = await supabase.rpc("complete_job", {
    _job_id: jobId,
    _result: result === undefined ? null : result,
  });
  if (error) throw new Error(`complete_job falhou: ${error.message}`);
}

/** retry=true devolve o job à fila com backoff exponencial (regra no banco). */
export async function failJob(jobId, message, retry = true) {
  const { error } = await supabase.rpc("fail_job", {
    _job_id: jobId,
    _error: String(message).slice(0, 2000),
    _retry: retry,
  });
  if (error) throw new Error(`fail_job falhou: ${error.message}`);
}

/** Recoloca na fila jobs travados por workers que morreram. */
export async function requeueStalledJobs(olderThan = "10 minutes") {
  const { data, error } = await supabase.rpc("requeue_stalled_jobs", {
    _older_than: olderThan,
  });
  if (error) throw new Error(`requeue_stalled_jobs falhou: ${error.message}`);
  return data ?? 0;
}

/** Acesso à fila `public.jobs` via API HTTP do aplicativo principal. */

import { config } from "./config.js";

function queueUrl(action) {
  return `${config.app.baseUrl}/api/public/jobs/${action}`;
}

async function post(action, body) {
  const response = await fetch(queueUrl(action), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-worker-secret": config.app.workerSecret,
    },
    body: JSON.stringify(body),
  });

  if (response.status === 401) {
    throw new Error(`Autenticação do worker falhou (x-worker-secret inválido?)`);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || `API ${action} retornou ${response.status}`);
  }

  return data;
}

/** Reserva atômica do próximo lote de jobs. */
export async function claimJobs(limit = 1, types = []) {
  const data = await post("claim", {
    worker: config.worker.name,
    limit,
    types: types.length ? types : undefined,
  });
  return data?.jobs ?? [];
}

export async function completeJob(jobId, result) {
  await post("complete", { jobId, result: result ?? null });
}

/** retry=true devolve o job à fila com backoff exponencial (regra no app). */
export async function failJob(jobId, message, retry = true) {
  await post("fail", {
    jobId,
    error: String(message).slice(0, 2000),
    retry,
  });
}

/** Recoloca na fila jobs travados por workers que morreram. */
export async function requeueStalledJobs(olderThan = "10 minutes") {
  const data = await post("requeue", { olderThan });
  return data?.requeued ?? 0;
}

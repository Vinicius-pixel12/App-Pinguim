/** Executa um job: escolhe o handler, aplica timeout e conclui/falha na fila. */

import { config } from "./config.js";
import { logger } from "./logger.js";
import { completeJob, failJob } from "./queue.js";
import { handlers } from "./handlers/index.js";
import { PermanentError, isRetryable, toMessage } from "./errors.js";

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} excedeu ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function processJob(job) {
  const log = logger.child({ jobId: job.id, type: job.type, attempt: job.attempts });
  const startedAt = Date.now();

  try {
    const handler = handlers[job.type];
    if (!handler) throw new PermanentError(`Nenhum handler registrado para "${job.type}"`);

    log.info("job iniciado");
    const result = await withTimeout(
      Promise.resolve(handler({ job, payload: job.payload ?? {}, log })),
      config.worker.jobTimeoutMs,
      `job ${job.type}`,
    );

    await completeJob(job.id, result ?? null);
    log.info("job concluído", { durationMs: Date.now() - startedAt });
    return { ok: true };
  } catch (error) {
    const retry = isRetryable(error);
    const message = toMessage(error);
    log.error("job falhou", { retry, error: message, durationMs: Date.now() - startedAt });
    try {
      await failJob(job.id, message, retry);
    } catch (queueError) {
      log.error("não foi possível registrar a falha", { error: toMessage(queueError) });
    }
    return { ok: false, retry };
  }
}

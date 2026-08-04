/**
 * Pinguim Worker — Background Worker (Render).
 *
 * Fluxo: claim_jobs → handler → complete_job / fail_job (backoff no banco).
 * Escala horizontal: basta subir mais instâncias (o lock SKIP LOCKED evita
 * que dois workers peguem o mesmo job).
 */

import { config } from "./config.js";
import { logger } from "./logger.js";
import { claimJobs, requeueStalledJobs } from "./queue.js";
import { processJob } from "./processor.js";
import { supportedTypes } from "./handlers/index.js";
import { toMessage } from "./errors.js";

let running = true;
let inFlight = 0;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function shutdown(signal) {
  if (!running) return;
  running = false;
  logger.warn("encerrando worker", { signal, inFlight });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  logger.error("unhandledRejection", { error: toMessage(reason) });
});
process.on("uncaughtException", (error) => {
  logger.error("uncaughtException", { error: toMessage(error) });
  shutdown("uncaughtException");
});

/** Recupera jobs travados por instâncias mortas (a cada 5 min). */
async function janitorLoop() {
  while (running) {
    try {
      const requeued = await requeueStalledJobs("10 minutes");
      if (requeued > 0) logger.warn("jobs travados devolvidos à fila", { requeued });
    } catch (error) {
      logger.error("janitor falhou", { error: toMessage(error) });
    }
    for (let i = 0; i < 300 && running; i++) await sleep(1000);
  }
}

async function mainLoop() {
  let consecutiveErrors = 0;

  while (running) {
    try {
      const jobs = await claimJobs(config.worker.batchSize, config.worker.types);
      consecutiveErrors = 0;

      if (jobs.length === 0) {
        await sleep(config.worker.idleIntervalMs);
        continue;
      }

      inFlight = jobs.length;
      await Promise.all(jobs.map((job) => processJob(job)));
      inFlight = 0;

      await sleep(config.worker.pollIntervalMs);
    } catch (error) {
      consecutiveErrors += 1;
      const backoff = Math.min(60_000, 2000 * 2 ** (consecutiveErrors - 1));
      logger.error("falha no loop principal", {
        error: toMessage(error),
        consecutiveErrors,
        backoffMs: backoff,
      });
      await sleep(backoff);
    }
  }

  logger.info("worker finalizado");
  process.exit(0);
}

logger.info("worker iniciado", {
  batchSize: config.worker.batchSize,
  pollIntervalMs: config.worker.pollIntervalMs,
  types: config.worker.types.length ? config.worker.types : supportedTypes,
});

void janitorLoop();
void mainLoop();

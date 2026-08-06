/** Configuração central do worker — lê env uma única vez, com validação. */

function env(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === "") return fallback;
  return value;
}

export function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  return value;
}

function int(name, fallback) {
  const raw = env(name);
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const config = {
  app: {
    baseUrl: requireEnv("APP_BASE_URL").replace(/\/$/, ""),
    workerSecret: requireEnv("JOBS_WORKER_SECRET"),
  },
  worker: {
    name: env("WORKER_NAME", `pinguim-worker-${process.pid}`),
    batchSize: int("WORKER_BATCH_SIZE", 3),
    pollIntervalMs: int("WORKER_POLL_INTERVAL_MS", 3000),
    idleIntervalMs: int("WORKER_IDLE_INTERVAL_MS", 8000),
    jobTimeoutMs: int("WORKER_JOB_TIMEOUT_MS", 10 * 60 * 1000),
    types: (env("WORKER_JOB_TYPES", "") || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  },
  logLevel: env("LOG_LEVEL", "info"),
};

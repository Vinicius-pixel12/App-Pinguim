/** Logger JSON estruturado (Render agrega stdout automaticamente). */

import { config } from "./config.js";

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = LEVELS[config.logLevel] ?? LEVELS.info;

function emit(level, message, meta) {
  if (LEVELS[level] < threshold) return;
  const line = {
    ts: new Date().toISOString(),
    level,
    worker: config.worker.name,
    msg: message,
    ...(meta ?? {}),
  };
  const out = level === "error" || level === "warn" ? process.stderr : process.stdout;
  out.write(`${JSON.stringify(line)}\n`);
}

export const logger = {
  debug: (msg, meta) => emit("debug", msg, meta),
  info: (msg, meta) => emit("info", msg, meta),
  warn: (msg, meta) => emit("warn", msg, meta),
  error: (msg, meta) => emit("error", msg, meta),
  child: (base) => ({
    debug: (msg, meta) => emit("debug", msg, { ...base, ...meta }),
    info: (msg, meta) => emit("info", msg, { ...base, ...meta }),
    warn: (msg, meta) => emit("warn", msg, { ...base, ...meta }),
    error: (msg, meta) => emit("error", msg, { ...base, ...meta }),
  }),
};

import { PermanentError } from "../errors.js";

/** purge_media: remove objetos órfãos do R2. */
export async function purgeMedia({ payload, log }) {
  const keys = payload?.keys;
  if (!Array.isArray(keys) || keys.length === 0) {
    throw new PermanentError("payload.keys deve ser uma lista não vazia");
  }
  log.info("purge_media recebido", { count: keys.length });
  throw new Error("[purge_media] handler ainda não implementado");
}

import { PermanentError } from "../errors.js";

/** compress_video: baixa do R2, transcodifica (720p/480p/HLS) e envia derivados. */
export async function compressVideo({ payload, log }) {
  if (!payload?.sourceKey) throw new PermanentError("payload.sourceKey ausente");
  log.info("compress_video recebido", { sourceKey: payload.sourceKey });
  throw new Error("[compress_video] handler ainda não implementado");
}

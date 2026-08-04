import { PermanentError } from "../errors.js";

/** optimize_image: redimensiona, remove EXIF e grava versão otimizada. */
export async function optimizeImage({ payload, log }) {
  if (!payload?.sourceKey) throw new PermanentError("payload.sourceKey ausente");
  log.info("optimize_image recebido", { sourceKey: payload.sourceKey });
  throw new Error("[optimize_image] handler ainda não implementado");
}

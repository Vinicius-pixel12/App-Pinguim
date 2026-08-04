import { PermanentError } from "../errors.js";

/** generate_thumbnail: extrai um frame de capa do vídeo. */
export async function generateThumbnail({ payload, log }) {
  if (!payload?.sourceKey) throw new PermanentError("payload.sourceKey ausente");
  log.info("generate_thumbnail recebido", { sourceKey: payload.sourceKey });
  throw new Error("[generate_thumbnail] handler ainda não implementado");
}

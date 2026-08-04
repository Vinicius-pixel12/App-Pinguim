import { PermanentError } from "../errors.js";

/** moderate_content: checagem de conteúdo impróprio em posts/stories. */
export async function moderateContent({ payload, log }) {
  if (!payload?.mediaUrl) throw new PermanentError("payload.mediaUrl ausente");
  log.info("moderate_content recebido", { mediaUrl: payload.mediaUrl });
  throw new Error("[moderate_content] handler ainda não implementado");
}

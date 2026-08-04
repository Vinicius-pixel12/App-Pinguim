import { PermanentError } from "../errors.js";

/** ai_image_edit: edição de imagem por IA solicitada pelo autor do post. */
export async function aiImageEdit({ payload, log }) {
  if (!payload?.postId) throw new PermanentError("payload.postId ausente");
  log.info("ai_image_edit recebido", { postId: payload.postId });
  throw new Error("[ai_image_edit] handler ainda não implementado");
}

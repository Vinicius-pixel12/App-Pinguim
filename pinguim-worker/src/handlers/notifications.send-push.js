import { PermanentError } from "../errors.js";

/** send_push: envia notificação FCM para todos os aparelhos do usuário. */
export async function sendPush({ payload, log }) {
  if (!payload?.userId) throw new PermanentError("payload.userId ausente");
  log.info("send_push recebido", { userId: payload.userId });
  throw new Error("[send_push] handler ainda não implementado");
}

import { PermanentError } from "../errors.js";

/** pix_payment: executa a transferência PIX de um saque aprovado. */
export async function pixPayment({ payload, log }) {
  if (!payload?.withdrawId) throw new PermanentError("payload.withdrawId ausente");
  log.info("pix_payment recebido", { withdrawId: payload.withdrawId });
  throw new Error("[pix_payment] handler ainda não implementado");
}

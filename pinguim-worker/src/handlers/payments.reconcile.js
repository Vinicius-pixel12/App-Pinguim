import { PermanentError } from "../errors.js";

/** reconcile_payment: confere o status de uma cobrança na Pagar.me. */
export async function reconcilePayment({ payload, log }) {
  if (!payload?.paymentId) throw new PermanentError("payload.paymentId ausente");
  log.info("reconcile_payment recebido", { paymentId: payload.paymentId });
  throw new Error("[reconcile_payment] handler ainda não implementado");
}

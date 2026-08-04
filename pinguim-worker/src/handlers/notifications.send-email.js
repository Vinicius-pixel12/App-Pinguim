import { PermanentError } from "../errors.js";

/** send_email: e-mails transacionais. */
export async function sendEmail({ payload, log }) {
  if (!payload?.to) throw new PermanentError("payload.to ausente");
  log.info("send_email recebido", { template: payload.template });
  throw new Error("[send_email] handler ainda não implementado");
}

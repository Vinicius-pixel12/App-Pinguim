import { PermanentError } from "../errors.js";

/** face_match: compara selfie x documento e atualiza kyc_verifications. */
export async function faceMatch({ payload, log }) {
  if (!payload?.userId) throw new PermanentError("payload.userId ausente");
  log.info("face_match recebido", { userId: payload.userId });
  throw new Error("[face_match] handler ainda não implementado");
}

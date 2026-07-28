/**
 * Provider de KYC — CAF (Combate a Fraude).
 *
 * STATUS: scaffold. Nenhuma chamada real implementada.
 *
 * PONTOS DE INTEGRAÇÃO:
 * - POST {CAF_API_URL}/v1/transactions  → inicia a execução do template
 * - GET  {CAF_API_URL}/v1/transactions/{id} → consulta status
 * - Webhook de conclusão → src/routes/api/public/webhooks/caf.ts
 *   (assinatura validada com CAF_WEBHOOK_SECRET, HMAC + timingSafeEqual)
 * - Imagens enviadas como URL assinada do bucket privado de KYC (R2),
 *   com TTL curto — nunca base64 no corpo da requisição.
 * - Após o webhook: atualizar public.kyc_verifications com service role.
 */

import { NotImplementedError } from "../core/errors";
import type {
  KycService,
  KycWebhookEvent,
  StartVerificationInput,
  VerificationResult,
} from "./types";

export function createCafKycService(): KycService {
  return {
    async startVerification(_input: StartVerificationInput): Promise<VerificationResult> {
      throw new NotImplementedError("caf", "startVerification");
    },
    async getVerification(_providerRequestId: string): Promise<VerificationResult> {
      throw new NotImplementedError("caf", "getVerification");
    },
    async parseWebhook(_rawBody: string, _signature: string | null): Promise<KycWebhookEvent> {
      throw new NotImplementedError("caf", "parseWebhook");
    },
  };
}

/** Limiar sugerido para auto-aprovação; revisão manual abaixo disso. */
export const CAF_AUTO_APPROVE_SCORE = 0.9;

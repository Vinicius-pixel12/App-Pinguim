/**
 * Contrato de verificação de identidade / biometria (implementação alvo: CAF).
 * Client-safe: apenas tipos.
 */

export type KycStatus = "pending" | "processing" | "approved" | "rejected" | "expired";

export type KycDocumentType = "cpf" | "rg" | "cnh" | "passport";

export type StartVerificationInput = {
  userId: string;
  cpf: string;
  fullName: string;
  birthDate?: string; // YYYY-MM-DD
  documentType: KycDocumentType;
  /** Chaves no bucket privado de KYC (R2), nunca binários inline. */
  selfieKey: string;
  documentFrontKey: string;
  documentBackKey?: string;
};

export type VerificationResult = {
  /** ID da execução no provedor, persistido em kyc_verifications. */
  providerRequestId: string;
  status: KycStatus;
  /** 0-1; usado para auto-aprovar acima de um limiar. */
  faceMatchScore?: number;
  livenessPassed?: boolean;
  /** Motivos legíveis quando reprovado. */
  reasons?: string[];
};

export type KycWebhookEvent = {
  providerRequestId: string;
  status: KycStatus;
  raw: unknown;
};

export interface KycService {
  startVerification(input: StartVerificationInput): Promise<VerificationResult>;
  getVerification(providerRequestId: string): Promise<VerificationResult>;
  /** Valida assinatura do webhook e normaliza o payload. */
  parseWebhook(rawBody: string, signature: string | null): Promise<KycWebhookEvent>;
}

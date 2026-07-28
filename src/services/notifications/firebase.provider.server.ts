/**
 * Provider de push — Firebase Cloud Messaging (HTTP v1).
 *
 * STATUS: scaffold. Nenhuma chamada real implementada.
 *
 * PONTOS DE INTEGRAÇÃO:
 * - Auth: JWT assinado com FIREBASE_PRIVATE_KEY (service account) trocado por
 *   access token em https://oauth2.googleapis.com/token. Usar WebCrypto —
 *   firebase-admin NÃO roda no runtime edge do Worker.
 * - Envio: POST https://fcm.googleapis.com/v1/projects/{id}/messages:send
 * - Lote: no máximo 500 tokens por requisição; enfileirar acima disso.
 * - Tokens inválidos (UNREGISTERED) devem ser removidos da tabela device_tokens.
 * - Service worker web em public/firebase-messaging-sw.js (a criar).
 */

import { NotImplementedError } from "../core/errors";
import type { DeviceToken, PushMessage, PushService } from "./types";

export function createFirebasePushService(): PushService {
  return {
    async registerToken(_input: Omit<DeviceToken, "createdAt">): Promise<void> {
      throw new NotImplementedError("firebase", "registerToken");
    },
    async unregisterToken(_token: string): Promise<void> {
      throw new NotImplementedError("firebase", "unregisterToken");
    },
    async sendToUser(_userId: string, _message: PushMessage) {
      throw new NotImplementedError("firebase", "sendToUser");
    },
    async sendToUsers(_userIds: string[], _message: PushMessage) {
      throw new NotImplementedError("firebase", "sendToUsers");
    },
    async sendToTopic(_topic: string, _message: PushMessage): Promise<void> {
      throw new NotImplementedError("firebase", "sendToTopic");
    },
  };
}

export const FCM_MAX_TOKENS_PER_BATCH = 500;

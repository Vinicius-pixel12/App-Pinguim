/**
 * Contrato de notificações push (implementação alvo: Firebase Cloud Messaging).
 * Client-safe: apenas tipos.
 */

export type DevicePlatform = "web" | "ios" | "android";

export type DeviceToken = {
  userId: string;
  token: string;
  platform: DevicePlatform;
  createdAt: string;
};

/** Tipos de push do produto — mantém payloads consistentes. */
export type PushTemplate =
  | "conversation_request"
  | "conversation_accepted"
  | "conversation_rejected"
  | "new_message"
  | "new_follower"
  | "kyc_result"
  | "withdraw_status";

export type PushMessage = {
  template: PushTemplate;
  title: string;
  body: string;
  /** Deep link dentro do app (ex.: "/conversas/123"). */
  clickPath?: string;
  imageUrl?: string;
  data?: Record<string, string>;
};

export interface PushService {
  registerToken(input: Omit<DeviceToken, "createdAt">): Promise<void>;
  unregisterToken(token: string): Promise<void>;
  sendToUser(userId: string, message: PushMessage): Promise<{ sent: number; failed: number }>;
  /** Envio em lote — obrigatório acima de alguns milhares de destinatários. */
  sendToUsers(
    userIds: string[],
    message: PushMessage,
  ): Promise<{ sent: number; failed: number }>;
  sendToTopic(topic: string, message: PushMessage): Promise<void>;
}

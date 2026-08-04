/**
 * Firebase Cloud Messaging (HTTP v1) — scaffold.
 * Autenticação via service account (JWT → OAuth token).
 */

import { requireEnv } from "../config.js";

export function firebaseCredentials() {
  return {
    projectId: requireEnv("FIREBASE_PROJECT_ID"),
    clientEmail: requireEnv("FIREBASE_CLIENT_EMAIL"),
    privateKey: requireEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
  };
}

export async function getAccessToken() {
  throw new Error("[firebase] getAccessToken ainda não implementado");
}

export async function sendToToken(_token, _notification, _data) {
  throw new Error("[firebase] sendToToken ainda não implementado");
}

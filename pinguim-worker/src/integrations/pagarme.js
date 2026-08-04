/**
 * Pagar.me — scaffold (transferências PIX de saque e conciliação).
 */

import { requireEnv } from "../config.js";

const BASE_URL = "https://api.pagar.me/core/v5";

export async function pagarmeFetch(path, init = {}) {
  const secret = requireEnv("PAGARME_SECRET_KEY");
  const auth = Buffer.from(`${secret}:`).toString("base64");
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
      ...(init.headers ?? {}),
    },
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`[pagarme] ${response.status}: ${body.slice(0, 500)}`);
  }
  return body ? JSON.parse(body) : null;
}

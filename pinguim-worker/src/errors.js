/** Erros do worker. */

/** Erro definitivo: não adianta tentar de novo (payload inválido, recurso removido). */
export class PermanentError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = "PermanentError";
    this.retryable = false;
    this.cause = cause;
  }
}

/** Erro temporário: rede, rate limit, indisponibilidade. Deve ser reprocessado. */
export class TransientError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = "TransientError";
    this.retryable = true;
    this.cause = cause;
  }
}

export function isRetryable(error) {
  if (error && typeof error.retryable === "boolean") return error.retryable;
  return true; // por padrão, tenta de novo (o limite de tentativas protege a fila)
}

export function toMessage(error) {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : JSON.stringify(error);
}

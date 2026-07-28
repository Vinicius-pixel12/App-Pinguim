/**
 * Erros compartilhados por todos os serviços.
 * Client-safe: não importa nada de servidor.
 */

export type ServiceName =
  | "supabase"
  | "r2"
  | "caf"
  | "firebase"
  | "ffmpeg"
  | "cdn";

export class ServiceError extends Error {
  constructor(
    public readonly service: ServiceName,
    message: string,
    public readonly code: string = "service_error",
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export class NotImplementedError extends ServiceError {
  constructor(service: ServiceName, operation: string) {
    super(
      service,
      `[${service}] "${operation}" ainda não foi implementado (scaffold de arquitetura).`,
      "not_implemented",
    );
    this.name = "NotImplementedError";
  }
}

/** Resultado padronizado para operações que não devem lançar exceção. */
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export const ok = <T>(data: T): Result<T> => ({ ok: true, data });
export const fail = <T = never>(code: string, message: string): Result<T> => ({
  ok: false,
  error: { code, message },
});

export type DomainErrorCode =
  | "NOT_FOUND"
  | "VALIDATION"
  | "SOLD_OUT"
  | "CONFLICT"
  | "INVALID_STATE"
  | "UNAUTHORIZED"
  | "PAYMENTS_UPSTREAM";

const STATUS: Record<DomainErrorCode, number> = {
  NOT_FOUND: 404,
  VALIDATION: 400,
  SOLD_OUT: 409,
  CONFLICT: 409,
  INVALID_STATE: 409,
  UNAUTHORIZED: 401,
  PAYMENTS_UPSTREAM: 502,
};

export class DomainError extends Error {
  override readonly name = "DomainError";
  readonly httpStatus: number;
  constructor(
    readonly code: DomainErrorCode,
    message: string,
    readonly hint?: string,
  ) {
    super(message);
    this.httpStatus = STATUS[code];
  }
}

export function notFound(what: string, id: string): DomainError {
  return new DomainError("NOT_FOUND", `${what} ${id} not found`);
}

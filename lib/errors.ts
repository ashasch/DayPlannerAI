/**
 * Application-level error codes.
 *
 * API routes return a code (never a raw message), and the client maps it onto a
 * localised string. This keeps all user-facing copy in `messages/*.json`.
 */
export const ERROR_CODES = {
  INVALID_CREDENTIALS: 'invalidCredentials',
  EMAIL_TAKEN: 'emailTaken',
  INVALID_TOKEN: 'invalidToken',
  RATE_LIMITED: 'rateLimited',
  VALIDATION: 'validation',
  /** No `OPENROUTER_API_KEY` — a deployment problem, not an upstream failure. */
  AI_NOT_CONFIGURED: 'aiNotConfigured',
  UNAUTHORIZED: 'unauthorized',
  NOT_FOUND: 'notFound',
  UNKNOWN: 'unknown',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/** An error carrying a stable, translatable code and an HTTP status. */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;

  constructor(code: ErrorCode, status = 400, message?: string) {
    super(message ?? code);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }
}

export type ApiErrorBody = { error: ErrorCode };

/** Narrows an unknown thrown value to a `{ code, status }` pair for API responses. */
export function toApiError(error: unknown): { code: ErrorCode; status: number } {
  if (error instanceof AppError) {
    return { code: error.code, status: error.status };
  }

  return { code: ERROR_CODES.UNKNOWN, status: 500 };
}

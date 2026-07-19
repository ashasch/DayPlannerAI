'use client';

import { useTranslations } from 'next-intl';

import { ERROR_CODES, type ErrorCode } from '@/lib/errors';

type ValidationKey = Parameters<ReturnType<typeof useTranslations<'auth.validation'>>>[0];
type ErrorKey = Parameters<ReturnType<typeof useTranslations<'auth.errors'>>>[0];

/** The subset of error codes that have copy under `auth.errors`. */
const AUTH_ERROR_CODES = [
  ERROR_CODES.INVALID_CREDENTIALS,
  ERROR_CODES.EMAIL_TAKEN,
  ERROR_CODES.INVALID_TOKEN,
  ERROR_CODES.RATE_LIMITED,
  ERROR_CODES.UNKNOWN,
] as const;

/**
 * Translates the *keys* that flow out of Zod schemas and API responses.
 *
 * Schemas emit keys such as `emailInvalid` and routes emit codes such as
 * `emailTaken`; neither carries user-facing copy, so all wording stays in
 * `messages/*.json` and both languages stay in sync automatically.
 */
export function useAuthMessages() {
  const tValidation = useTranslations('auth.validation');
  const tErrors = useTranslations('auth.errors');

  return {
    /** Resolves a Zod issue key, or `undefined` when the field is valid. */
    validation(key: string | undefined): string | undefined {
      if (!key) return undefined;
      return tValidation(key as ValidationKey);
    },

    /**
     * Resolves an API error code, falling back to the generic message.
     *
     * Only codes that actually have copy under `auth.errors` are passed
     * through — a non-auth code (say, an AI failure) would otherwise render as
     * a raw missing-message key.
     */
    error(code: string | undefined): string {
      const known = (AUTH_ERROR_CODES as readonly string[]).includes(code ?? '');
      return tErrors((known ? code : ERROR_CODES.UNKNOWN) as ErrorKey);
    },
  };
}

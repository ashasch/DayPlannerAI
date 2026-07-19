import 'server-only';

import { z } from 'zod';

/**
 * Server-side environment schema.
 *
 * Nothing here is ever bundled into client code — every consumer of this module
 * imports `server-only`, so an accidental client import fails the build instead
 * of leaking a secret.
 */
/**
 * Treats an empty variable as absent.
 *
 * `.env` files routinely contain placeholder lines like `ANTHROPIC_API_KEY=`,
 * which arrive as `''` rather than `undefined` and would otherwise fail a
 * `.min(1)` check instead of falling back to the optional path.
 */
const optionalString = () =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().min(1).optional(),
  );

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  /** Auth.js signing secret. Required in production, generated-by-hand locally. */
  AUTH_SECRET: optionalString(),

  /** Anthropic credentials. Optional so the app still boots without AI configured. */
  ANTHROPIC_API_KEY: optionalString(),
  ANTHROPIC_MODEL: optionalString().default('claude-sonnet-5'),

  /** Directory backing the local development data store. */
  DATA_DIR: optionalString().default('.data'),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

const parsed = serverEnvSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map(
    (issue) => `  • ${issue.path.join('.')}: ${issue.message}`,
  );
  throw new Error(`Invalid environment variables:\n${issues.join('\n')}`);
}

export const env: ServerEnv = parsed.data;

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';

/** True when an Anthropic key is present; used to render AI state without throwing. */
export const isAiConfigured = Boolean(env.ANTHROPIC_API_KEY);

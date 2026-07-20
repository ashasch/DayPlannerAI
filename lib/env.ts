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
 * `.env` files routinely contain placeholder lines like `OPENROUTER_API_KEY=`,
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

  /**
   * OpenRouter credentials. Optional so the app still boots without AI configured.
   *
   * Named for the actual provider: the key is an OpenRouter key (`sk-or-…`) and
   * is sent to openrouter.ai, even though the Anthropic SDK is the transport.
   */
  OPENROUTER_API_KEY: optionalString(),

  /** Must be an OpenRouter-namespaced model id. */
  OPENROUTER_MODEL: optionalString().default('anthropic/claude-sonnet-4.5'),

  /**
   * OAuth credentials. A provider is only registered when BOTH halves are
   * present — a client id without its secret cannot complete the code
   * exchange, so half-configured providers are treated as absent rather than
   * failing at the callback with an opaque error.
   */
  GITHUB_CLIENT_ID: optionalString(),
  GITHUB_CLIENT_SECRET: optionalString(),
  GOOGLE_CLIENT_ID: optionalString(),
  GOOGLE_CLIENT_SECRET: optionalString(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

const parsed = serverEnvSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map(
    (issue) => `  • ${issue.path.join('.')}: ${issue.message}`,
  );
  throw new Error(`Invalid environment variables:\n${issues.join('\n')}`);
}

/**
 * Postgres connection string.
 *
 * Vercel injects `POSTGRES_URL` when you attach a database; `DATABASE_URL` is
 * the conventional name everywhere else. Accepting either means the same build
 * runs on Vercel, locally, and in CI without per-environment glue.
 *
 * Kept out of the schema above because the resolution order matters and a
 * missing value needs an actionable message, not a generic Zod issue.
 */
function resolveDatabaseUrl(): string {
  const url = firstNonEmpty(process.env.DATABASE_URL, process.env.POSTGRES_URL);

  if (!url) {
    throw new Error(
      'Missing database connection string. Set DATABASE_URL (or POSTGRES_URL) in .env.local.\n' +
        'On Vercel this is added automatically when a Postgres database is attached;\n' +
        'locally run `vercel env pull .env.local` or paste the connection string by hand.',
    );
  }

  return url;
}

function firstNonEmpty(...values: (string | undefined)[]): string | undefined {
  return values.find((value) => typeof value === 'string' && value.trim() !== '');
}

export const env: ServerEnv & { DATABASE_URL: string } = {
  ...parsed.data,
  // Lazily-thrown at import time of any module that touches the database, which
  // is exactly when a missing URL becomes a real problem.
  get DATABASE_URL() {
    return resolveDatabaseUrl();
  },
};

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';

/** True when an Anthropic key is present; used to render AI state without throwing. */
export const isAiConfigured = Boolean(env.OPENROUTER_API_KEY);

export const isGitHubOAuthConfigured = Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET);
export const isGoogleOAuthConfigured = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

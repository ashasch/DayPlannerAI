import 'server-only';

import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { env } from '@/lib/env';

import * as schema from './schema';

/**
 * Postgres connection.
 *
 * Tuned for serverless: each Vercel function instance is its own process, so a
 * large pool per instance would exhaust the database's connection limit as
 * concurrency grows. `prepare: false` is required because Vercel Postgres (and
 * Supabase) front the database with PgBouncer in transaction mode, which cannot
 * carry server-side prepared statements across pooled connections.
 */
function createClient() {
  return postgres(env.DATABASE_URL, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });
}

/**
 * Connections are created on first query, never at import time.
 *
 * `next build` imports every route module to collect page data. Connecting
 * eagerly would therefore make the build itself require a reachable database
 * and a populated `DATABASE_URL` — so a missing variable would fail the build
 * instead of surfacing as a clear runtime error on the one request that needs
 * the database.
 *
 * The globals survive dev hot-reloads, which would otherwise leak a new pool on
 * every edit until Postgres refused further connections.
 */
const globalForDb = globalThis as unknown as {
  __dayPlannerSql?: ReturnType<typeof createClient>;
  __dayPlannerDb?: PostgresJsDatabase<typeof schema>;
};

export function getSql() {
  return (globalForDb.__dayPlannerSql ??= createClient());
}

export function getDb(): PostgresJsDatabase<typeof schema> {
  return (globalForDb.__dayPlannerDb ??= drizzle(getSql(), { schema }));
}

export { schema };

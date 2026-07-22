import type { NextRequest } from 'next/server';

import { auth } from '@/auth';
import { fail, handleRouteError, ok } from '@/lib/api/responses';
import { getDashboardStats } from '@/lib/db/dashboard-repository';
import { dashboardQuerySchema } from '@/lib/dashboard/schemas';
import { resolveHeatmapRange, resolvePeriod } from '@/lib/dashboard/period';
import { ERROR_CODES } from '@/lib/errors';

/** Rejects anything that is not plausibly an IANA zone before it reaches SQL. */
function safeTimeZone(value: string | null): string {
  if (!value || !/^[A-Za-z0-9+_\-/]{1,64}$/.test(value)) return 'UTC';

  try {
    // Throws on an unknown zone, which keeps a bad value out of the query.
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return value;
  } catch {
    return 'UTC';
  }
}

/** Aggregated dashboard statistics for the signed-in user. */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return fail(ERROR_CODES.UNAUTHORIZED, 401);
    }

    const params = request.nextUrl.searchParams;
    const parsed = dashboardQuerySchema.safeParse({
      scope: params.get('scope') ?? undefined,
      period: params.get('period') ?? undefined,
      from: params.get('from') ?? undefined,
      to: params.get('to') ?? undefined,
      today: params.get('today') ?? undefined,
    });

    if (!parsed.success) {
      return fail(ERROR_CODES.VALIDATION, 422);
    }

    const { scope, period, from, to, today } = parsed.data;
    const range = resolvePeriod(period, today, { from, to });
    const heatmap = resolveHeatmapRange(today);

    const stats = await getDashboardStats({
      userId: session.user.id,
      scope,
      from: range.from,
      to: range.to,
      timeZone: safeTimeZone(params.get('tz')),
      heatmapFrom: heatmap.from,
      heatmapTo: heatmap.to,
    });

    return ok({ stats, range, heatmapRange: heatmap });
  } catch (error) {
    return handleRouteError(error, 'dashboard/stats');
  }
}

import type { DashboardStats, WeeklySummary } from '@/lib/dashboard/types';
import { todayIso } from '@/lib/date';

export interface StatsRequest {
  scope: string;
  period: string;
  from?: string;
  to?: string;
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const code =
      typeof body === 'object' && body !== null && 'error' in body
        ? String((body as { error: unknown }).error)
        : 'unknown';

    throw new Error(code);
  }

  return response.json() as Promise<T>;
}

/** The browser's zone, so completions land on the user's day, not UTC's. */
function currentTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export async function fetchStats(
  params: StatsRequest,
  signal?: AbortSignal,
): Promise<DashboardStats> {
  const query = new URLSearchParams({
    scope: params.scope,
    period: params.period,
    today: todayIso(),
    tz: currentTimeZone(),
  });

  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);

  const { stats } = await request<{ stats: DashboardStats }>(`/api/dashboard/stats?${query}`, {
    signal,
  });

  return stats;
}

export interface SummaryResponse {
  summary: WeeklySummary | null;
  aiConfigured?: boolean;
}

/** Reads the cached summary. Never triggers a generation. */
export async function fetchSummary(signal?: AbortSignal): Promise<SummaryResponse> {
  const query = new URLSearchParams({ today: todayIso() });
  return request<SummaryResponse>(`/api/dashboard/summary?${query}`, { signal });
}

/** Generates the summary — only ever called from an explicit user action. */
export async function generateSummary(regenerate: boolean): Promise<SummaryResponse> {
  return request<SummaryResponse>('/api/dashboard/summary', {
    method: 'POST',
    body: JSON.stringify({ regenerate, today: todayIso() }),
  });
}

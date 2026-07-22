'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Info } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchStats } from '@/features/dashboard/lib/api';
import type { DashboardStats } from '@/lib/dashboard/types';

import { ActivityHeatmap } from './activity-heatmap';
import { CategoryChart } from './category-chart';
import { DashboardFilters, isFilterQueryable, type FilterState } from './dashboard-filters';
import { MetricCards } from './metric-cards';
import { WeeklySummaryCard } from './weekly-summary-card';
import { WeekdayChart } from './weekday-chart';

const INITIAL_FILTER: FilterState = { scope: 'all', period: 'all', from: '', to: '' };

/** Task analytics: metrics, category and weekday breakdowns, activity heatmap. */
export function DashboardScreen() {
  const t = useTranslations('dashboard');

  const [filter, setFilter] = useState<FilterState>(INITIAL_FILTER);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // An incomplete custom range would query the whole history by accident.
    if (!isFilterQueryable(filter)) return;

    const controller = new AbortController();
    setIsLoading(true);

    fetchStats(
      {
        scope: filter.scope,
        period: filter.period,
        from: filter.from || undefined,
        to: filter.to || undefined,
      },
      controller.signal,
    )
      .then((next) => {
        setStats(next);
        setHasError(false);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof DOMException && error.name === 'AbortError') return;

        setHasError(true);
        toast.error(t('loadFailed'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [filter, t]);

  const isEmpty = stats !== null && stats.totals.taskCount === 0 && stats.heatmap.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t('title')}</h1>
        <p className="max-w-xl text-pretty text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      <WeeklySummaryCard />

      <DashboardFilters
        value={filter}
        // Functional merge, so rapid changes cannot clobber each other.
        onChange={(patch) => setFilter((current) => ({ ...current, ...patch }))}
        disabled={isLoading && !stats}
      />

      {hasError && !stats ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {t('loadFailed')}
        </p>
      ) : !stats ? (
        <DashboardSkeleton />
      ) : isEmpty ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <p className="max-w-sm text-balance text-sm text-muted-foreground">{t('empty')}</p>
          <Button asChild variant="outline">
            <Link href="/capture">{t('emptyCta')}</Link>
          </Button>
        </div>
      ) : (
        <div className={isLoading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <div className="flex flex-col gap-6">
            <MetricCards totals={stats.totals} />

            <div className="grid gap-6 lg:grid-cols-2">
              <CategoryChart data={stats.byCategory} />
              <WeekdayChart data={stats.byWeekday} />
            </div>

            <ActivityHeatmap data={stats.heatmap} />

            {/*
              Time-of-day is deliberately absent rather than faked: tasks store
              a plain date with no clock time, so a morning/afternoon/evening
              split would be invented data.
            */}
            <p className="flex items-start gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span className="text-pretty">
                <span className="font-medium text-foreground">{t('timeOfDay.title')}. </span>
                {t('timeOfDay.explanation')}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} className="h-[5.5rem] rounded-xl" />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>

      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { CheckCircle2, Clock, ListTodo, Tag } from 'lucide-react';

import { useFormatDuration } from '@/features/tasks/lib/use-format-duration';
import type { DashboardTotals } from '@/lib/dashboard/types';

interface MetricCardsProps {
  totals: DashboardTotals;
}

/** The four headline numbers for the selected period. */
export function MetricCards({ totals }: MetricCardsProps) {
  const t = useTranslations('dashboard.metrics');
  const formatDuration = useFormatDuration();

  const cards = [
    {
      key: 'taskCount',
      label: t('taskCount'),
      value: String(totals.taskCount),
      detail: null,
      Icon: ListTodo,
    },
    {
      key: 'totalMinutes',
      label: t('totalMinutes'),
      value: totals.totalMinutes > 0 ? formatDuration(totals.totalMinutes) : t('none'),
      detail: null,
      Icon: Clock,
    },
    {
      key: 'completionRate',
      label: t('completionRate'),
      value: `${totals.completionRate}%`,
      detail: t('completionDetail', {
        completed: totals.completedCount,
        total: totals.taskCount,
      }),
      Icon: CheckCircle2,
    },
    {
      key: 'busiestCategory',
      label: t('busiestCategory'),
      value: totals.busiestCategory ?? t('none'),
      detail: null,
      Icon: Tag,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map(({ key, label, value, detail, Icon }) => (
        <div key={key} className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{label}</span>
          </div>

          <p className="truncate text-2xl font-semibold tabular-nums" title={value}>
            {value}
          </p>

          {detail ? (
            <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">{detail}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

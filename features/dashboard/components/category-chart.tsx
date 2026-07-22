'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { useFormatDuration } from '@/features/tasks/lib/use-format-duration';
import type { CategoryStat } from '@/lib/dashboard/types';
import { cn } from '@/lib/utils';

import { AXIS_PROPS, ChartEmpty, ChartShell, TOOLTIP_STYLES } from './chart-shell';

type Metric = 'count' | 'time';

/**
 * Opacity ramp over the accent colour.
 *
 * Categories are user-defined, so there is no fixed palette to assign; shading
 * one hue by rank keeps the chart readable and automatically follows whichever
 * accent the user picked.
 */
function barOpacity(index: number, total: number): number {
  if (total <= 1) return 1;
  return 1 - (index / total) * 0.55;
}

export function CategoryChart({ data }: { data: CategoryStat[] }) {
  const t = useTranslations('dashboard.categories');
  const tMetrics = useTranslations('dashboard.metrics');
  const formatDuration = useFormatDuration();
  const [metric, setMetric] = useState<Metric>('count');

  const rows = data.map((row) => ({
    name: row.category ?? tMetrics('noCategory'),
    count: row.taskCount,
    time: row.totalMinutes,
  }));

  const sorted = [...rows].sort((a, b) => b[metric] - a[metric]);
  const hasData = sorted.some((row) => row[metric] > 0);

  return (
    <ChartShell
      title={t('title')}
      subtitle={t('subtitle')}
      action={
        <div
          role="radiogroup"
          aria-label={t('subtitle')}
          className="inline-flex rounded-lg border border-border p-0.5"
        >
          {(['count', 'time'] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={metric === value}
              onClick={() => setMetric(value)}
              className={cn(
                'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
                metric === value
                  ? 'bg-primary-muted text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {value === 'count' ? t('byCount') : t('byTime')}
            </button>
          ))}
        </div>
      }
    >
      {!hasData ? (
        <ChartEmpty message={t('empty')} />
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(160, sorted.length * 40)}>
          <BarChart data={sorted} layout="vertical" margin={{ left: 8, right: 16 }}>
            <XAxis type="number" {...AXIS_PROPS} allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={92} {...AXIS_PROPS} />
            <Tooltip
              {...TOOLTIP_STYLES}
              formatter={(value) => {
                const amount = Number(value ?? 0);
                return [
                  metric === 'time' ? formatDuration(amount) : `${amount} ${t('tasks')}`,
                  metric === 'time' ? t('byTime') : t('byCount'),
                ];
              }}
            />
            {/*
              No entry animation: recharts renders the bars *through* it, so a
              tab that is backgrounded while the page loads shows an empty
              chart until it is focused. A dashboard should just be there.
            */}
            <Bar dataKey={metric} radius={[0, 6, 6, 0]} isAnimationActive={false}>
              {sorted.map((row, index) => (
                <Cell
                  key={row.name}
                  fill="hsl(var(--primary))"
                  fillOpacity={barOpacity(index, sorted.length)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartShell>
  );
}

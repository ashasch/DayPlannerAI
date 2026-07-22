'use client';

import { useTranslations } from 'next-intl';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { useFormatDuration } from '@/features/tasks/lib/use-format-duration';
import type { WeekdayStat } from '@/lib/dashboard/types';

import { AXIS_PROPS, ChartEmpty, ChartShell, TOOLTIP_STYLES } from './chart-shell';

type WeekdayKey = '0' | '1' | '2' | '3' | '4' | '5' | '6';

export function WeekdayChart({ data }: { data: WeekdayStat[] }) {
  const t = useTranslations('dashboard.weekdays');
  const tCategories = useTranslations('dashboard.categories');
  const formatDuration = useFormatDuration();

  const rows = data.map((row) => ({
    name: t(`short.${String(row.weekday) as WeekdayKey}`),
    count: row.taskCount,
    minutes: row.totalMinutes,
  }));

  const busiestCount = Math.max(...rows.map((row) => row.count));
  const hasData = busiestCount > 0;
  const busiest = rows.find((row) => row.count === busiestCount);

  return (
    <ChartShell
      title={t('title')}
      // Naming the busiest day answers the "which days are loaded?" question
      // directly, instead of leaving it to be read off the bars.
      subtitle={hasData && busiest ? t('busiest', { day: busiest.name }) : t('subtitle')}
    >
      {!hasData ? (
        <ChartEmpty message={t('empty')} />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={rows} margin={{ left: -20, right: 8 }}>
            <XAxis dataKey="name" {...AXIS_PROPS} />
            <YAxis {...AXIS_PROPS} allowDecimals={false} />
            <Tooltip
              {...TOOLTIP_STYLES}
              formatter={(value) => [
                `${Number(value ?? 0)} ${tCategories('tasks')}`,
                tCategories('byCount'),
              ]}
              // Only `count` is drawn as a series, so the total time has to ride
              // along on the label — a formatter for it would never be called.
              labelFormatter={(label, payload) => {
                const row = payload?.[0]?.payload as { minutes?: number } | undefined;
                const minutes = Number(row?.minutes ?? 0);
                return minutes > 0 ? `${String(label)} · ${formatDuration(minutes)}` : label;
              }}
            />
            {/* See CategoryChart: the entry animation can leave the chart
                blank on a backgrounded tab. */}
            <Bar dataKey="count" radius={[6, 6, 0, 0]} isAnimationActive={false}>
              {rows.map((row) => (
                <Cell
                  key={row.name}
                  fill="hsl(var(--primary))"
                  // The peak day stays solid; the rest recede.
                  fillOpacity={row.count === busiestCount ? 1 : 0.45}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartShell>
  );
}

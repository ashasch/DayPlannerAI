'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { addDays, fromIsoDate, startOfWeek, toIsoDate, todayIso } from '@/lib/date';
import { HEATMAP_WEEKS, type HeatmapDay } from '@/lib/dashboard/types';
import { LOCALE_TO_BCP47, type Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

import { ChartShell } from './chart-shell';

/**
 * Five intensity steps over the accent colour.
 *
 * Opacity rather than five hand-picked colours, so the scale follows whichever
 * accent is active and stays legible in both themes.
 */
const LEVEL_OPACITY = [0, 0.25, 0.45, 0.7, 1] as const;

/** Maps a day's count onto a step. Thresholds are fixed, not relative to the
 *  busiest day — otherwise a quiet month would look identical to a busy one. */
function levelFor(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

export function ActivityHeatmap({ data }: { data: HeatmapDay[] }) {
  const t = useTranslations('dashboard.heatmap');
  const locale = useLocale() as Locale;
  const bcp47 = LOCALE_TO_BCP47[locale];

  const { weeks, monthLabels } = useMemo(() => {
    const counts = new Map(data.map((day) => [day.date, day.completedCount]));

    const today = fromIsoDate(todayIso());
    const start = startOfWeek(addDays(today, -7 * (HEATMAP_WEEKS - 1)));

    const builtWeeks: { date: string; count: number; inFuture: boolean }[][] = [];
    const labels: { index: number; label: string }[] = [];
    let lastMonth = -1;

    for (let week = 0; week < HEATMAP_WEEKS; week += 1) {
      const days = Array.from({ length: 7 }, (_, day) => {
        const date = addDays(start, week * 7 + day);
        const iso = toIsoDate(date);

        return {
          date: iso,
          count: counts.get(iso) ?? 0,
          // The current week runs past today; those cells are drawn blank.
          inFuture: iso > toIsoDate(today),
        };
      });

      // Label a column when its first day starts a new month.
      const firstOfWeek = addDays(start, week * 7);
      if (firstOfWeek.getMonth() !== lastMonth) {
        lastMonth = firstOfWeek.getMonth();
        labels.push({
          index: week,
          label: firstOfWeek.toLocaleDateString(bcp47, { month: 'short' }),
        });
      }

      builtWeeks.push(days);
    }

    return { weeks: builtWeeks, monthLabels: labels };
  }, [data, bcp47]);

  function tooltipFor(iso: string, count: number): string {
    const label = fromIsoDate(iso).toLocaleDateString(bcp47, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return count > 0 ? t('tooltip', { date: label, count }) : t('tooltipNone', { date: label });
  }

  return (
    <ChartShell title={t('title')} subtitle={t('subtitle')}>
      <div className="overflow-x-auto pb-1">
        <div className="min-w-max">
          <div className="mb-1 flex gap-[3px]">
            {weeks.map((_, index) => {
              const label = monthLabels.find((entry) => entry.index === index);
              return (
                <span
                  key={index}
                  className="w-[13px] text-[9px] leading-none text-muted-foreground"
                >
                  {label?.label ?? ''}
                </span>
              );
            })}
          </div>

          <div className="flex gap-[3px]">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[3px]">
                {week.map((day) => (
                  <span
                    key={day.date}
                    // `title` gives a native tooltip on hover with no extra
                    // JavaScript, and works on keyboard focus in most browsers.
                    title={day.inFuture ? undefined : tooltipFor(day.date, day.count)}
                    aria-label={day.inFuture ? undefined : tooltipFor(day.date, day.count)}
                    className={cn(
                      'size-[13px] rounded-[3px]',
                      day.inFuture ? 'bg-transparent' : 'bg-muted',
                    )}
                    style={
                      day.inFuture || day.count === 0
                        ? undefined
                        : {
                            backgroundColor: `hsl(var(--primary) / ${
                              LEVEL_OPACITY[levelFor(day.count)]
                            })`,
                          }
                    }
                  />
                ))}
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
            <span>{t('less')}</span>
            {LEVEL_OPACITY.map((opacity, index) => (
              <span
                key={index}
                className={cn('size-[13px] rounded-[3px]', index === 0 && 'bg-muted')}
                style={
                  index === 0 ? undefined : { backgroundColor: `hsl(var(--primary) / ${opacity})` }
                }
              />
            ))}
            <span>{t('more')}</span>
          </div>
        </div>
      </div>
    </ChartShell>
  );
}

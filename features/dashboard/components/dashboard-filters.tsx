'use client';

import { useTranslations } from 'next-intl';

import {
  DASHBOARD_PERIODS,
  DASHBOARD_SCOPES,
  type DashboardPeriod,
  type DashboardScope,
} from '@/lib/dashboard/types';
import { cn } from '@/lib/utils';

export interface FilterState {
  scope: DashboardScope;
  period: DashboardPeriod;
  from: string;
  to: string;
}

interface DashboardFiltersProps {
  value: FilterState;
  /**
   * Receives only the changed fields.
   *
   * A whole-object callback would spread a `value` captured at render time, so
   * two updates landing in one batch would silently undo each other. A patch
   * lets the parent merge functionally and always see the latest state.
   */
  onChange: (patch: Partial<FilterState>) => void;
  disabled?: boolean;
}

/** Scope toggle, period presets and the custom range inputs. */
export function DashboardFilters({ value, onChange, disabled }: DashboardFiltersProps) {
  const t = useTranslations('dashboard');

  const isRangeInvalid =
    value.period === 'custom' && value.from !== '' && value.to !== '' && value.from > value.to;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div
          role="radiogroup"
          aria-label={t('scope.label')}
          className="inline-flex rounded-lg border border-border p-0.5"
        >
          {DASHBOARD_SCOPES.map((scope) => (
            <button
              key={scope}
              type="button"
              role="radio"
              aria-checked={value.scope === scope}
              disabled={disabled}
              onClick={() => onChange({ scope })}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50',
                value.scope === scope
                  ? 'bg-primary-muted text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t(`scope.${scope}`)}
            </button>
          ))}
        </div>

        <div
          role="radiogroup"
          aria-label={t('period.label')}
          className="inline-flex flex-wrap rounded-lg border border-border p-0.5"
        >
          {DASHBOARD_PERIODS.map((period) => (
            <button
              key={period}
              type="button"
              role="radio"
              aria-checked={value.period === period}
              disabled={disabled}
              onClick={() => onChange({ period })}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50',
                value.period === period
                  ? 'bg-primary-muted text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t(`period.${period}`)}
            </button>
          ))}
        </div>
      </div>

      {value.period === 'custom' ? (
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{t('period.from')}</span>
            <input
              type="date"
              value={value.from}
              max={value.to || undefined}
              disabled={disabled}
              onChange={(event) => onChange({ from: event.target.value })}
              className="h-9 rounded-md border border-input bg-card px-2 text-sm outline-none focus-visible:border-ring"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{t('period.to')}</span>
            <input
              type="date"
              value={value.to}
              min={value.from || undefined}
              disabled={disabled}
              onChange={(event) => onChange({ to: event.target.value })}
              className="h-9 rounded-md border border-input bg-card px-2 text-sm outline-none focus-visible:border-ring"
            />
          </label>

          {isRangeInvalid ? (
            <p role="alert" className="pb-2 text-xs text-destructive">
              {t('period.invalidRange')}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Whether the current filter is complete enough to query. */
export function isFilterQueryable(filter: FilterState): boolean {
  if (filter.period !== 'custom') return true;

  return filter.from !== '' && filter.to !== '' && filter.from <= filter.to;
}

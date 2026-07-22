'use client';

import { cn } from '@/lib/utils';

interface ChartShellProps {
  title: string;
  subtitle?: string;
  /** Rendered top-right — a toggle or legend. */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/** Shared card frame so every dashboard block lines up. */
export function ChartShell({ title, subtitle, action, children, className }: ChartShellProps) {
  return (
    <section className={cn('rounded-xl border border-border bg-card p-4 sm:p-5', className)}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-medium">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        {action}
      </header>

      {children}
    </section>
  );
}

/** Centred placeholder used when a block has nothing to draw. */
export function ChartEmpty({ message }: { message: string }) {
  return (
    <p className="flex min-h-[8rem] items-center justify-center text-balance text-center text-sm text-muted-foreground">
      {message}
    </p>
  );
}

/**
 * Tooltip styling shared by both charts.
 *
 * Recharts renders inline styles, so the theme tokens have to be handed to it
 * explicitly rather than through classes.
 */
export const TOOLTIP_STYLES = {
  contentStyle: {
    background: 'hsl(var(--popover))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '0.75rem',
    fontSize: '0.75rem',
    color: 'hsl(var(--popover-foreground))',
    boxShadow: '0 8px 24px hsl(0 0% 0% / 0.18)',
  },
  labelStyle: { color: 'hsl(var(--foreground))', fontWeight: 500, marginBottom: 2 },
  itemStyle: { color: 'hsl(var(--muted-foreground))' },
  cursor: { fill: 'hsl(var(--muted) / 0.5)' },
} as const;

export const AXIS_PROPS = {
  stroke: 'hsl(var(--muted-foreground))',
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

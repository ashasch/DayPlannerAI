'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarPlus, CalendarX2, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { addDays, toIsoDate, todayIso } from '@/lib/date';
import type { IsoDate } from '@/lib/tasks/types';

interface TaskDatePickerProps {
  value: IsoDate | null;
  onChange: (date: IsoDate | null) => void;
  disabled?: boolean;
  /** Rendered as the trigger; falls back to a calendar icon button. */
  children?: React.ReactNode;
}

/**
 * Assigns or clears a task's planned day.
 *
 * Shortcuts cover the overwhelmingly common cases; the native date input
 * handles everything else — it brings its own locale-aware, accessible,
 * mobile-friendly calendar, which is far better than a hand-rolled grid.
 */
export function TaskDatePicker({ value, onChange, disabled, children }: TaskDatePickerProps) {
  const t = useTranslations('tasks.actions');
  const dateInputRef = useRef<HTMLInputElement>(null);

  const today = todayIso();
  const tomorrow = toIsoDate(addDays(new Date(), 1));

  function openNativePicker() {
    const input = dateInputRef.current;
    if (!input) return;

    // `showPicker` is the only reliable way to open the calendar overlay; older
    // browsers fall back to focusing the (visually hidden) input.
    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
        return;
      } catch {
        // Some browsers throw unless the call is directly user-activated.
      }
    }

    input.focus();
    input.click();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disabled}>
          {children ?? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
              aria-label={value ? t('changeDate') : t('setDate')}
              title={value ? t('changeDate') : t('setDate')}
            >
              <CalendarPlus className="size-4" aria-hidden />
            </Button>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="min-w-[12rem]">
          <DropdownMenuItem onSelect={() => onChange(today)} className="justify-between">
            <span>{t('today')}</span>
            {value === today ? <Check className="size-4" aria-hidden /> : null}
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => onChange(tomorrow)} className="justify-between">
            <span>{t('tomorrow')}</span>
            {value === tomorrow ? <Check className="size-4" aria-hidden /> : null}
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={(event) => {
              // The menu closes on select; opening the picker in the same tick
              // loses the user-activation the browser requires.
              event.preventDefault();
              setTimeout(openNativePicker, 0);
            }}
          >
            <CalendarPlus className="size-4" aria-hidden />
            <span>{t('pickDate')}</span>
          </DropdownMenuItem>

          {value ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => onChange(null)}>
                <CalendarX2 className="size-4" aria-hidden />
                <span>{t('clearDate')}</span>
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Kept in the layout (not `display:none`) so `showPicker` can anchor to it. */}
      <input
        ref={dateInputRef}
        type="date"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value || null)}
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute size-0 opacity-0"
      />
    </>
  );
}

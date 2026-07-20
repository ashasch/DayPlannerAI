'use client';

import { useState } from 'react';
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
 * Shortcuts cover the common cases; the native date input handles everything
 * else, bringing its own locale-aware, accessible calendar.
 *
 * The input is a real, visible control inside the menu rather than a hidden one
 * opened via `showPicker()`. That earlier approach was broken on iOS Safari:
 * `showPicker()` needs transient user activation, deferring it past the tap
 * discarded that activation (`NotAllowedError`), and the fallback of
 * focus()/click() on a zero-size `pointer-events: none` input does nothing on
 * iOS, which only opens the date wheel for a genuine tap on a hit-testable
 * input. Letting the user tap the input directly needs no activation, no
 * synthetic events and no feature detection — it works the same everywhere.
 */
export function TaskDatePicker({ value, onChange, disabled, children }: TaskDatePickerProps) {
  const t = useTranslations('tasks.actions');
  const [isOpen, setIsOpen] = useState(false);

  const today = todayIso();
  const tomorrow = toIsoDate(addDays(new Date(), 1));

  function selectDate(date: IsoDate | null) {
    setIsOpen(false);
    onChange(date);
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
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

      <DropdownMenuContent align="end" className="min-w-[13rem]">
        <DropdownMenuItem onSelect={() => selectDate(today)} className="justify-between">
          <span>{t('today')}</span>
          {value === today ? <Check className="size-4" aria-hidden /> : null}
        </DropdownMenuItem>

        <DropdownMenuItem onSelect={() => selectDate(tomorrow)} className="justify-between">
          <span>{t('tomorrow')}</span>
          {value === tomorrow ? <Check className="size-4" aria-hidden /> : null}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/*
          A plain wrapper, not a DropdownMenuItem: menu items hijack pointer and
          keyboard handling, which would stop the input from ever receiving the
          tap. Key events are contained so the menu's typeahead does not swallow
          digits typed into the field.
        */}
        <div
          className="px-1 py-1"
          onKeyDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <label className="flex flex-col gap-1">
            <span className="px-1.5 text-xs text-muted-foreground">{t('pickDate')}</span>
            <input
              type="date"
              value={value ?? ''}
              onChange={(event) => selectDate(event.target.value || null)}
              className="h-9 w-full rounded-md border border-input bg-card px-2 text-sm outline-none focus-visible:border-ring"
            />
          </label>
        </div>

        {value ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => selectDate(null)}>
              <CalendarX2 className="size-4" aria-hidden />
              <span>{t('clearDate')}</span>
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

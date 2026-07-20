'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Clock, X } from 'lucide-react';
import { toast } from 'sonner';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFormatDuration } from '@/features/tasks/lib/use-format-duration';
import { ESTIMATE_PRESETS, MAX_ESTIMATE_MINUTES, MIN_ESTIMATE_MINUTES } from '@/lib/tasks/duration';
import { cn } from '@/lib/utils';

interface TaskEstimatePickerProps {
  value: number | null;
  onChange: (minutes: number | null) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Shows the time estimate and lets it be edited in place.
 *
 * Presets cover almost every case; the custom input swaps the trigger for a
 * number field rather than living inside the dropdown, because a focusable
 * input inside a Radix menu fights the menu's own focus management and closes
 * on the first keystroke.
 */
export function TaskEstimatePicker({
  value,
  onChange,
  disabled,
  className,
}: TaskEstimatePickerProps) {
  const t = useTranslations('tasks.actions');
  const tToasts = useTranslations('tasks.toasts');
  const formatDuration = useFormatDuration();

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Entering edit mode is deferred through a timeout (see the menu item below),
   * so by the time it runs the captured `value` may be a render behind — which
   * showed up as the custom input opening blank instead of prefilled. A ref
   * always reads the current one.
   */
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    if (isEditing) inputRef.current?.select();
  }, [isEditing]);

  function startEditing() {
    const current = valueRef.current;
    setDraft(current ? String(current) : '');
    setIsEditing(true);
  }

  function commit() {
    const trimmed = draft.trim();

    // An emptied field means "no estimate" rather than an invalid one.
    if (trimmed === '') {
      setIsEditing(false);
      if (valueRef.current !== null) onChange(null);
      return;
    }

    const parsed = Number(trimmed);

    if (
      !Number.isFinite(parsed) ||
      !Number.isInteger(parsed) ||
      parsed < MIN_ESTIMATE_MINUTES ||
      parsed > MAX_ESTIMATE_MINUTES
    ) {
      toast.error(
        tToasts('estimateInvalid', { min: MIN_ESTIMATE_MINUTES, max: MAX_ESTIMATE_MINUTES }),
      );
      inputRef.current?.select();
      return;
    }

    setIsEditing(false);
    if (parsed !== valueRef.current) onChange(parsed);
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="number"
        inputMode="numeric"
        min={MIN_ESTIMATE_MINUTES}
        max={MAX_ESTIMATE_MINUTES}
        value={draft}
        autoFocus
        aria-label={t('changeEstimate')}
        onChange={(event) => setDraft(event.target.value)}
        onClick={(event) => event.stopPropagation()}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit();
          } else if (event.key === 'Escape') {
            event.preventDefault();
            // Escape abandons the edit; blur must not then commit it.
            setIsEditing(false);
          }
        }}
        className={cn(
          'h-6 w-16 rounded-md border border-input bg-card px-1.5 text-xs tabular-nums outline-none',
          'focus-visible:border-ring',
          className,
        )}
      />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          type="button"
          aria-label={value ? t('changeEstimate') : t('setEstimate')}
          title={value ? t('changeEstimate') : t('setEstimate')}
          onClick={(event) => event.stopPropagation()}
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-xs text-muted-foreground',
            'transition-colors hover:bg-accent hover:text-foreground',
            'disabled:pointer-events-none disabled:opacity-50',
            className,
          )}
        >
          <Clock className="size-3 shrink-0" aria-hidden />
          <span className="tabular-nums">{value ? formatDuration(value) : t('setEstimate')}</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-[11rem]">
        <DropdownMenuLabel>{t('changeEstimate')}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {ESTIMATE_PRESETS.map((preset) => (
          <DropdownMenuItem
            key={preset}
            onSelect={() => onChange(preset)}
            className="justify-between"
          >
            <span>{formatDuration(preset)}</span>
            {preset === value ? <Check className="size-4" aria-hidden /> : null}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={(event) => {
            // The menu closes on select; swapping to the input in the same tick
            // would lose the focus we are about to place in it.
            event.preventDefault();
            setTimeout(startEditing, 0);
          }}
        >
          <span>{t('customEstimate')}</span>
        </DropdownMenuItem>

        {value !== null ? (
          <DropdownMenuItem onSelect={() => onChange(null)}>
            <X className="size-4" aria-hidden />
            <span>{t('clearEstimate')}</span>
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

'use client';

import { useRef, useState } from 'react';
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

/** Parses a custom entry, or `null` when it is not a usable estimate. */
function parseEstimate(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;

  const parsed = Number(trimmed);

  if (
    !Number.isFinite(parsed) ||
    !Number.isInteger(parsed) ||
    parsed < MIN_ESTIMATE_MINUTES ||
    parsed > MAX_ESTIMATE_MINUTES
  ) {
    return null;
  }

  return parsed;
}

/**
 * Shows the time estimate and lets it be edited.
 *
 * Like the date picker, the custom field is a real input rendered inside the
 * menu rather than something swapped in afterwards. The previous version
 * deferred entering edit mode through `setTimeout`, which on iOS meant the
 * keyboard never opened (Safari only raises it for a focus inside a genuine
 * user gesture) and, on every platform, meant the handler read a stale `value`
 * from an older render. A field the user simply taps needs neither a timer nor
 * a ref to work around one.
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

  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState('');

  /**
   * Set when a menu item takes over, so the field's own blur does not also
   * commit. Choosing a preset blurs the input first, which would otherwise fire
   * a second, conflicting update right before the preset's.
   */
  const handledElsewhere = useRef(false);

  function handleOpenChange(open: boolean) {
    // Seeding on open means the field always starts from the current value,
    // with no ref needed to dodge a stale closure.
    if (open) {
      setDraft(value ? String(value) : '');
      handledElsewhere.current = false;
    }
    setIsOpen(open);
  }

  function select(minutes: number | null) {
    handledElsewhere.current = true;
    setIsOpen(false);
    onChange(minutes);
  }

  function commitDraft({ silent }: { silent: boolean }) {
    const trimmed = draft.trim();
    const parsed = parseEstimate(draft);

    if (parsed === null && trimmed !== '') {
      // On blur this is usually someone dismissing the menu, not submitting —
      // complaining about it would be noise.
      if (!silent) {
        toast.error(
          tToasts('estimateInvalid', { min: MIN_ESTIMATE_MINUTES, max: MAX_ESTIMATE_MINUTES }),
        );
      }
      return;
    }

    select(parsed);
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
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

      <DropdownMenuContent align="start" className="min-w-[12rem]">
        <DropdownMenuLabel>{t('changeEstimate')}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {ESTIMATE_PRESETS.map((preset) => (
          <DropdownMenuItem
            key={preset}
            onSelect={() => select(preset)}
            className="justify-between"
          >
            <span>{formatDuration(preset)}</span>
            {preset === value ? <Check className="size-4" aria-hidden /> : null}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/*
          A plain wrapper, not a DropdownMenuItem: menu items intercept pointer
          events, so the tap would never reach the field. Key events stop here
          so the menu's typeahead does not swallow the digits being typed.
        */}
        <div
          className="px-1 py-1"
          onKeyDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <label className="flex flex-col gap-1">
            <span className="px-1.5 text-xs text-muted-foreground">{t('customEstimate')}</span>
            <input
              type="number"
              inputMode="numeric"
              min={MIN_ESTIMATE_MINUTES}
              max={MAX_ESTIMATE_MINUTES}
              value={draft}
              placeholder={t('estimateHint', {
                min: MIN_ESTIMATE_MINUTES,
                max: MAX_ESTIMATE_MINUTES,
              })}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return;
                event.preventDefault();
                commitDraft({ silent: false });
              }}
              onBlur={() => {
                if (handledElsewhere.current) return;
                commitDraft({ silent: true });
              }}
              className="h-9 w-full rounded-md border border-input bg-card px-2 text-sm tabular-nums outline-none focus-visible:border-ring"
            />
          </label>
        </div>

        {value !== null ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => select(null)}>
              <X className="size-4" aria-hidden />
              <span>{t('clearEstimate')}</span>
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

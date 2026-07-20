'use client';

import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

interface TaskCheckboxProps {
  completed: boolean;
  onToggle: (completed: boolean) => void;
  disabled?: boolean;
  /** `sm` fits inside a calendar chip; `md` is the Inbox card size. */
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Done/not-done toggle.
 *
 * A `role="checkbox"` button rather than a real `<input>`: it sits inside other
 * clickable surfaces (calendar chips open a dialog), so it needs to stop the
 * click from propagating — which is far cleaner on a button than on a native
 * checkbox wrapped in a label.
 */
export function TaskCheckbox({
  completed,
  onToggle,
  disabled,
  size = 'md',
  className,
}: TaskCheckboxProps) {
  const t = useTranslations('tasks.actions');
  const label = completed ? t('reopen') : t('complete');

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={completed}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(event) => {
        // The chip behind this opens the detail dialog; toggling must not.
        event.stopPropagation();
        onToggle(!completed);
      }}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-[5px] border transition-colors',
        'hover:border-foreground/60 disabled:pointer-events-none disabled:opacity-50',
        size === 'sm' ? 'size-3.5' : 'size-[18px]',
        completed
          ? 'border-foreground bg-foreground text-background'
          : 'border-muted-foreground/50 bg-transparent',
        className,
      )}
    >
      {completed ? (
        <Check className={size === 'sm' ? 'size-2.5' : 'size-3'} strokeWidth={3} aria-hidden />
      ) : null}
    </button>
  );
}

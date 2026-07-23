'use client';

import { useTranslations } from 'next-intl';
import { Check, Tag, X } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCategoryLabel } from '@/features/tasks/lib/use-category-label';
import { TASK_CATEGORIES, type TaskCategory } from '@/lib/tasks/categories';
import { cn } from '@/lib/utils';

interface TaskCategoryPickerProps {
  value: TaskCategory | null;
  onChange: (category: TaskCategory | null) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Shows and edits a task's category.
 *
 * Options come from the canonical list, so only a valid code can ever be
 * chosen; the labels are translations of those codes.
 */
export function TaskCategoryPicker({
  value,
  onChange,
  disabled,
  className,
}: TaskCategoryPickerProps) {
  const t = useTranslations('tasks.actions');
  const categoryLabel = useCategoryLabel();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          type="button"
          aria-label={value ? t('changeCategory') : t('setCategory')}
          title={value ? t('changeCategory') : t('setCategory')}
          onClick={(event) => event.stopPropagation()}
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-xs text-muted-foreground',
            'transition-colors hover:bg-accent hover:text-foreground',
            'disabled:pointer-events-none disabled:opacity-50',
            className,
          )}
        >
          <Tag className="size-3 shrink-0" aria-hidden />
          <span>{value ? categoryLabel(value) : t('setCategory')}</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-[11rem]">
        <DropdownMenuLabel>{t('changeCategory')}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {TASK_CATEGORIES.map((category) => (
          <DropdownMenuItem
            key={category}
            onSelect={() => onChange(category)}
            className="justify-between"
          >
            <span>{categoryLabel(category)}</span>
            {category === value ? <Check className="size-4" aria-hidden /> : null}
          </DropdownMenuItem>
        ))}

        {value ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onChange(null)}>
              <X className="size-4" aria-hidden />
              <span>{t('clearCategory')}</span>
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

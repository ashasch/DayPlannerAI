'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';

import { isTaskCategory, type TaskCategory } from '@/lib/tasks/categories';

/**
 * Translates a stored category code for display.
 *
 * The single place category text is produced. Rendering `task.category`
 * directly is what let raw database values — some of them Ukrainian, some
 * English — leak into the UI and look like duplicate categories.
 */
export function useCategoryLabel() {
  const t = useTranslations('tasks.category');

  return useCallback(
    (category: TaskCategory | string | null | undefined): string => {
      if (!category) return t('none');

      // A legacy row that predates normalisation still has to render as
      // something, so an unknown code falls back to "other".
      return isTaskCategory(category) ? t(category) : t('other');
    },
    [t],
  );
}

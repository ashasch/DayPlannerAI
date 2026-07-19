'use client';

import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Inbox } from 'lucide-react';

import type { ExtractedTask, TaskPriority } from '@/lib/ai/schemas';
import { cn } from '@/lib/utils';

/** Visual weight per priority — high reads as urgent without shouting. */
const PRIORITY_STYLES: Record<TaskPriority, string> = {
  high: 'border-destructive/40 bg-destructive/10 text-destructive',
  medium: 'border-border bg-secondary text-secondary-foreground',
  low: 'border-border bg-transparent text-muted-foreground',
};

/** Sort order so the day's most important work surfaces first. */
const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

interface TaskListProps {
  tasks: ExtractedTask[];
}

/** Renders the structured tasks the AI extracted from a brain dump. */
export function TaskList({ tasks }: TaskListProps) {
  const t = useTranslations('capture.results');

  const sorted = [...tasks].sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="mt-8"
      aria-label={t('title')}
    >
      <h2 className="mb-3 px-1 text-sm font-medium text-muted-foreground">{t('title')}</h2>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-10 text-center">
          <Inbox className="size-5 text-muted-foreground" aria-hidden />
          <p className="text-balance text-sm text-muted-foreground">{t('empty')}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {sorted.map((task, index) => (
              <motion.li
                key={`${task.title}-${index}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.4) }}
                className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-pretty text-sm font-medium leading-snug">{task.title}</p>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {task.category ? <span>{task.category}</span> : null}

                    {task.estimatedMinutes ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" aria-hidden />
                        {t('estimate', { minutes: task.estimatedMinutes })}
                      </span>
                    ) : null}
                  </div>
                </div>

                <span
                  className={cn(
                    'shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-medium',
                    PRIORITY_STYLES[task.priority],
                  )}
                >
                  {t(`priority.${task.priority}`)}
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </motion.section>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { Inbox } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchTasks } from '@/features/tasks/lib/api';
import { useTaskMutations } from '@/features/tasks/lib/use-task-mutations';
import type { Task } from '@/lib/tasks/types';

import { PRIORITY_RANK } from './priority-badge';
import { TaskCard } from './task-card';

/**
 * The Inbox: every saved task, scheduled or not.
 *
 * Edits (completion, priority, date, delete) go through `useTaskMutations`,
 * which the Calendar uses too — so both screens behave identically and there is
 * one place to change how optimistic updates and rollbacks work.
 */
export function InboxScreen() {
  const t = useTranslations('inbox');
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [hasError, setHasError] = useState(false);

  const mutations = useTaskMutations(setTasks);

  useEffect(() => {
    const controller = new AbortController();

    fetchTasks(controller.signal)
      .then(setTasks)
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof DOMException && error.name === 'AbortError') return;

        setHasError(true);
        toast.error(t('loadFailed'));
      });

    return () => controller.abort();
  }, [t]);

  if (hasError && !tasks) {
    return (
      <Shell title={t('title')} subtitle={t('subtitle')}>
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {t('loadFailed')}
        </p>
      </Shell>
    );
  }

  if (!tasks) {
    return (
      <Shell title={t('title')} subtitle={t('subtitle')}>
        <div className="space-y-2">
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-[4.5rem] w-full rounded-xl" />
          ))}
        </div>
      </Shell>
    );
  }

  if (tasks.length === 0) {
    return (
      <Shell title={t('title')} subtitle={t('subtitle')}>
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <Inbox className="size-6 text-muted-foreground" aria-hidden />
          <p className="max-w-sm text-balance text-sm text-muted-foreground">{t('empty')}</p>
          <Button asChild variant="outline">
            <Link href="/capture">{t('emptyCta')}</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  // Scheduled work first, ordered by day; undated tasks sink to the bottom
  // where they read as a backlog rather than as today's problem.
  const scheduled = tasks
    .filter((task) => task.plannedDate)
    .sort(
      (a, b) =>
        (a.plannedDate ?? '').localeCompare(b.plannedDate ?? '') ||
        PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
    );

  const unscheduled = tasks
    .filter((task) => !task.plannedDate)
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);

  return (
    <Shell title={t('title')} subtitle={t('subtitle')} count={t('count', { count: tasks.length })}>
      <div className="space-y-8">
        {[
          { key: 'scheduled', label: t('scheduled'), items: scheduled },
          { key: 'unscheduled', label: t('unscheduled'), items: unscheduled },
        ]
          .filter((group) => group.items.length > 0)
          .map((group) => (
            <section key={group.key}>
              <h2 className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {group.label}
              </h2>

              <ul className="space-y-2">
                <AnimatePresence initial={false}>
                  {group.items.map((task) => (
                    <motion.li
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <TaskCard
                        task={task}
                        onToggleCompleted={(completed) =>
                          void mutations.setCompleted(task, completed)
                        }
                        onChangePriority={(priority) => void mutations.setPriority(task, priority)}
                        onChangeCategory={(category) => void mutations.setCategory(task, category)}
                        onChangeEstimate={(minutes) =>
                          void mutations.setEstimatedMinutes(task, minutes)
                        }
                        onChangeDate={(date) => void mutations.setPlannedDate(task, date)}
                        onDelete={() => void mutations.remove(task)}
                      />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </section>
          ))}
      </div>
    </Shell>
  );
}

function Shell({
  title,
  subtitle,
  count,
  children,
}: {
  title: string;
  subtitle: string;
  count?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
      <header className="mb-8 space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          {count ? <span className="text-xs text-muted-foreground">{count}</span> : null}
        </div>
        <p className="max-w-xl text-pretty text-sm text-muted-foreground">{subtitle}</p>
      </header>

      {children}
    </div>
  );
}

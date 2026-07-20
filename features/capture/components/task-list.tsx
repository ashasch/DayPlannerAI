'use client';

import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Inbox, Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PRIORITY_RANK, PriorityBadge } from '@/features/tasks/components/priority-badge';
import { TaskDateBadge } from '@/features/tasks/components/task-date-badge';
import { TaskDatePicker } from '@/features/tasks/components/task-date-picker';
import { useFormatDuration } from '@/features/tasks/lib/use-format-duration';
import type { DraftItem, IsoDate } from '@/lib/tasks/types';

interface TaskDraftListProps {
  drafts: DraftItem[];
  onRemove: (id: string) => void;
  onChangeDate: (id: string, date: IsoDate | null) => void;
  onSave: () => void;
  onDiscard: () => void;
  isSaving: boolean;
}

/**
 * The reviewable result of an analysis.
 *
 * Nothing here is persisted yet — the user prunes the list and presses save,
 * so a bad extraction never pollutes the Inbox.
 */
export function TaskDraftList({
  drafts,
  onRemove,
  onChangeDate,
  onSave,
  onDiscard,
  isSaving,
}: TaskDraftListProps) {
  const t = useTranslations('capture.results');
  const formatDuration = useFormatDuration();

  // Sorting a copy keeps the caller's array order untouched; every callback
  // below identifies the draft by id, so display order is irrelevant to it.
  const ordered = [...drafts].sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="mt-8"
      aria-label={t('title')}
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 px-1">
        <h2 className="text-sm font-medium text-muted-foreground">{t('title')}</h2>
        {drafts.length > 0 ? <p className="text-xs text-muted-foreground/70">{t('hint')}</p> : null}
      </div>

      {drafts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-10 text-center">
          <Inbox className="size-5 text-muted-foreground" aria-hidden />
          <p className="text-balance text-sm text-muted-foreground">{t('empty')}</p>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {ordered.map((draft) => (
                <motion.li
                  key={draft.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-pretty text-sm font-medium leading-snug">{draft.title}</p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {draft.category ? <span>{draft.category}</span> : null}
                      {draft.estimatedMinutes ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3" aria-hidden />
                          {formatDuration(draft.estimatedMinutes)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    {draft.plannedDate ? <TaskDateBadge date={draft.plannedDate} /> : null}
                    <PriorityBadge priority={draft.priority} />

                    <TaskDatePicker
                      value={draft.plannedDate}
                      onChange={(date) => onChangeDate(draft.id, date)}
                      disabled={isSaving}
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemove(draft.id)}
                      disabled={isSaving}
                      aria-label={t('remove')}
                      title={t('remove')}
                    >
                      <X className="size-4" aria-hidden />
                    </Button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onDiscard} disabled={isSaving}>
              {t('discard')}
            </Button>

            <Button type="button" onClick={onSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  {t('saving')}
                </>
              ) : (
                t('save')
              )}
            </Button>
          </div>
        </>
      )}
    </motion.section>
  );
}

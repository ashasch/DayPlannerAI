'use client';

import { useCallback, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { Eraser, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useAutoResizeTextarea } from '@/hooks/use-auto-resize-textarea';
import { useSpeechRecognition, type SpeechErrorKey } from '@/hooks/use-speech-recognition';
import { createTasks } from '@/features/tasks/lib/api';
import { todayIso } from '@/lib/date';
import { ERROR_CODES } from '@/lib/errors';
import { LOCALE_TO_BCP47, type Locale } from '@/lib/i18n/config';
import { createDraftId, type DraftItem, type IsoDate, type TaskDraft } from '@/lib/tasks/types';
import { cn } from '@/lib/utils';

import { AiStatusBadge } from './ai-status-badge';
import { TaskDraftList } from './task-list';
import { VoiceRecorder } from './voice-recorder';

/**
 * The Capture screen: one big textarea for emptying your head into.
 *
 * Owns the brain-dump text and the speech recognition session so that dictated
 * phrases and typed text land in the same place, in order.
 */
export function CaptureScreen() {
  const t = useTranslations('capture');
  const tResults = useTranslations('capture.results');
  const tAiStatus = useTranslations('ai.status');
  const locale = useLocale() as Locale;

  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * `null` until the first successful analysis. These are unsaved drafts — the
   * user reviews them and presses save before anything reaches the database.
   */
  const [drafts, setDrafts] = useState<DraftItem[] | null>(null);

  const { textareaRef } = useAutoResizeTextarea({ value: text });

  /**
   * Appends a finalised phrase to whatever is already in the textarea,
   * inserting a space only where one is actually needed.
   */
  const appendTranscript = useCallback((transcript: string) => {
    setText((current) => {
      if (!current) return transcript;
      return /\s$/.test(current) ? current + transcript : `${current} ${transcript}`;
    });
  }, []);

  const handleSpeechError = useCallback(
    (key: SpeechErrorKey) => toast.error(t(`voice.${key}`)),
    [t],
  );

  const speech = useSpeechRecognition({
    lang: LOCALE_TO_BCP47[locale],
    onResult: appendTranscript,
    onError: handleSpeechError,
  });

  const trimmedText = text.trim();
  const hasText = trimmedText.length > 0;
  const isBusy = isProcessing || isSaving;

  function handleClear() {
    setText('');
    // Stale results next to an empty textarea would be confusing.
    setDrafts(null);
    speech.stop();
    toast.success(t('cleared'));
    textareaRef.current?.focus();
  }

  async function handleProcess() {
    if (!hasText) {
      toast.warning(t('emptyWarning'));
      textareaRef.current?.focus();
      return;
    }

    // Stop dictation first so nothing lands in the textarea mid-request.
    speech.stop();
    setIsProcessing(true);

    try {
      const response = await fetch('/api/ai/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // The server runs in UTC on Vercel, so "today" has to come from the
        // browser or relative dates resolve against the wrong day.
        body: JSON.stringify({ text: trimmedText, locale, today: todayIso() }),
      });

      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const code =
          typeof body === 'object' && body !== null && 'error' in body
            ? String((body as { error: unknown }).error)
            : ERROR_CODES.UNKNOWN;

        // A missing API key is a setup problem, not a failed request — say so.
        toast.error(
          code === ERROR_CODES.AI_NOT_CONFIGURED ? tAiStatus('notConfigured') : t('processError'),
        );
        return;
      }

      const body = (await response.json()) as { tasks?: TaskDraft[] };
      const extracted = body.tasks ?? [];

      setDrafts(extracted.map((draft) => ({ ...draft, id: createDraftId() })));
      toast.success(t('processSuccess', { count: extracted.length }));
    } catch {
      toast.error(t('processError'));
    } finally {
      setIsProcessing(false);
    }
  }

  function handleRemoveDraft(id: string) {
    setDrafts((current) => current?.filter((draft) => draft.id !== id) ?? null);
  }

  function handleChangeDraftDate(id: string, plannedDate: IsoDate | null) {
    setDrafts(
      (current) =>
        current?.map((draft) => (draft.id === id ? { ...draft, plannedDate } : draft)) ?? null,
    );
  }

  async function handleSaveDrafts() {
    if (!drafts || drafts.length === 0) return;

    setIsSaving(true);

    try {
      // `id` is a client-side handle only; the server assigns the real one.
      const saved = await createTasks(drafts.map(({ id: _id, ...draft }) => draft));

      toast.success(tResults('saved', { count: saved.length }));

      // The dump has been turned into tasks; clear the slate for the next one.
      setDrafts(null);
      setText('');
      textareaRef.current?.focus();
    } catch {
      toast.error(tResults('saveFailed'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-4 pb-24 pt-10 sm:px-6 sm:pt-16">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8 space-y-3"
      >
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
          {t('title')}
        </h1>
        <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t('hint')}
        </p>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'rounded-2xl border border-border bg-card transition-colors duration-300',
          'focus-within:border-ring',
          speech.isRecording && 'border-destructive/50',
        )}
      >
        <label htmlFor="brain-dump" className="sr-only">
          {t('title')}
        </label>

        <textarea
          id="brain-dump"
          ref={textareaRef}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={t('placeholder')}
          disabled={isBusy}
          spellCheck
          autoFocus
          className={cn(
            'w-full resize-none rounded-2xl bg-transparent px-4 py-4 text-base leading-relaxed outline-none',
            'placeholder:text-muted-foreground/70',
            'disabled:opacity-60',
            'scrollbar-none sm:px-5 sm:py-5 sm:text-lg',
          )}
        />

        {/* Live dictation preview — not yet committed to the textarea value. */}
        <AnimatePresence>
          {speech.interimTranscript ? (
            <motion.p
              key="interim-transcript"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden px-4 text-base italic leading-relaxed text-muted-foreground/60 sm:px-5 sm:text-lg"
            >
              {speech.interimTranscript}
            </motion.p>
          ) : null}
        </AnimatePresence>

        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 px-3 py-3 sm:px-4">
          <VoiceRecorder
            status={speech.status}
            onStart={speech.start}
            onPause={speech.pause}
            onResume={speech.resume}
            onStop={speech.stop}
            disabled={isBusy}
          />

          <span className="ml-auto flex items-center gap-2">
            <AnimatePresence>
              {hasText ? (
                <motion.span
                  key="clear-button"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    disabled={isBusy}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Eraser className="size-4" aria-hidden />
                    <span className="hidden sm:inline">{t('clear')}</span>
                  </Button>
                </motion.span>
              ) : null}
            </AnimatePresence>

            <Button type="button" onClick={handleProcess} disabled={isBusy || !hasText}>
              {isProcessing ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  {t('processing')}
                </>
              ) : (
                <>
                  <Sparkles className="size-4" aria-hidden />
                  {t('process')}
                </>
              )}
            </Button>
          </span>
        </div>
      </motion.div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
        <AiStatusBadge />

        <p className="text-xs tabular-nums text-muted-foreground/70" aria-live="polite">
          {t('charactersCount', { count: text.length })}
        </p>
      </div>

      {drafts ? (
        <TaskDraftList
          drafts={drafts}
          onRemove={handleRemoveDraft}
          onChangeDate={handleChangeDraftDate}
          onSave={handleSaveDrafts}
          onDiscard={() => setDrafts(null)}
          isSaving={isSaving}
        />
      ) : null}
    </div>
  );
}

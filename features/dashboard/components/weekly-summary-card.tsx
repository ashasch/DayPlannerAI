'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchSummary, generateSummary } from '@/features/dashboard/lib/api';
import { ERROR_CODES } from '@/lib/errors';
import { LOCALE_TO_BCP47, type Locale } from '@/lib/i18n/config';
import type { WeeklySummary } from '@/lib/dashboard/types';

/**
 * The AI reflection on the past week.
 *
 * Reads the cache on mount but never generates: an inference call only happens
 * when the user presses the button, so opening the dashboard is always free.
 */
export function WeeklySummaryCard() {
  const t = useTranslations('dashboard.summary');
  const locale = useLocale() as Locale;

  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    fetchSummary(controller.signal)
      .then((response) => {
        setSummary(response.summary);
        setAiConfigured(response.aiConfigured ?? true);
      })
      .catch(() => {
        // A missing cache is not worth a toast; the button still works.
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  async function handleGenerate() {
    setIsGenerating(true);

    try {
      // Always an explicit regenerate: the button exists to get a fresh read.
      const response = await generateSummary(true);
      setSummary(response.summary);
    } catch (error) {
      const code = error instanceof Error ? error.message : ERROR_CODES.UNKNOWN;
      toast.error(code === ERROR_CODES.AI_NOT_CONFIGURED ? t('notConfigured') : t('failed'));
    } finally {
      setIsGenerating(false);
    }
  }

  const generatedLabel = summary
    ? t('generatedAt', {
        date: new Date(summary.generatedAt).toLocaleString(LOCALE_TO_BCP47[locale], {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
      })
    : null;

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-1.5 text-sm font-medium">
            <Sparkles className="size-3.5 shrink-0 text-primary" aria-hidden />
            {t('title')}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{generatedLabel ?? t('subtitle')}</p>
        </div>

        <Button
          type="button"
          variant={summary ? 'ghost' : 'default'}
          size="sm"
          onClick={handleGenerate}
          disabled={isGenerating || !aiConfigured}
        >
          {isGenerating ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {t('generating')}
            </>
          ) : summary ? (
            <>
              <RefreshCw className="size-4" aria-hidden />
              {t('regenerate')}
            </>
          ) : (
            t('generate')
          )}
        </Button>
      </header>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      ) : summary ? (
        <p className="text-pretty text-sm leading-relaxed">{summary.content}</p>
      ) : (
        <p className="text-pretty text-sm text-muted-foreground">
          {aiConfigured ? t('empty') : t('notConfigured')}
        </p>
      )}
    </section>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

type Status = 'checking' | 'ready' | 'notConfigured' | 'unreachable';

/**
 * Live indicator for the Anthropic connection.
 *
 * Checked from the client after paint so a slow or failing upstream never
 * blocks the Capture screen from rendering — the user can start typing
 * immediately regardless of AI availability.
 */
export function AiStatusBadge({ className }: { className?: string }) {
  const t = useTranslations('ai.status');
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    const controller = new AbortController();

    async function check() {
      try {
        const response = await fetch('/api/ai/health', { signal: controller.signal });

        if (!response.ok) {
          setStatus('unreachable');
          return;
        }

        const body: unknown = await response.json();
        const next =
          typeof body === 'object' && body !== null && 'status' in body
            ? String((body as { status: unknown }).status)
            : 'unreachable';

        setStatus(
          next === 'ready' || next === 'notConfigured' || next === 'unreachable'
            ? next
            : 'unreachable',
        );
      } catch {
        if (!controller.signal.aborted) setStatus('unreachable');
      }
    }

    void check();

    return () => controller.abort();
  }, []);

  const Icon = status === 'checking' ? Loader2 : status === 'ready' ? CheckCircle2 : AlertCircle;

  return (
    <p
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center gap-1.5 text-xs text-muted-foreground',
        status === 'unreachable' && 'text-destructive',
        className,
      )}
    >
      <Icon
        className={cn('size-3.5 shrink-0', status === 'checking' && 'animate-spin')}
        aria-hidden
      />
      <span>{t(status)}</span>
    </p>
  );
}

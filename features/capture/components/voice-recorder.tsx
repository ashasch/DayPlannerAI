'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Mic, MicOff, Pause, Play, Square } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { SpeechRecognitionStatus } from '@/hooks/use-speech-recognition';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  status: SpeechRecognitionStatus;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  disabled?: boolean;
}

/**
 * Microphone control for the Capture screen.
 *
 * Purely presentational — the recognition engine lives in the parent so that a
 * single hook instance owns the transcript and this component stays trivially
 * testable. Renders the full record → pause → resume → stop cycle.
 */
export function VoiceRecorder({
  status,
  onStart,
  onPause,
  onResume,
  onStop,
  disabled,
}: VoiceRecorderProps) {
  const t = useTranslations('capture.voice');

  if (status === 'unsupported') {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <MicOff className="size-4 shrink-0" aria-hidden />
        <span>{t('unsupported')}</span>
      </div>
    );
  }

  const isRecording = status === 'recording';
  const isPaused = status === 'paused';

  if (!isRecording && !isPaused) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onStart}
        disabled={disabled}
        aria-label={t('start')}
        title={t('start')}
        className="rounded-full"
      >
        <Mic className="size-4" aria-hidden />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <RecordingIndicator label={isRecording ? t('recording') : t('paused')} active={isRecording} />

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={isRecording ? onPause : onResume}
        aria-label={isRecording ? t('pause') : t('resume')}
        title={isRecording ? t('pause') : t('resume')}
        className="rounded-full"
      >
        {isRecording ? (
          <Pause className="size-4" aria-hidden />
        ) : (
          <Play className="size-4" aria-hidden />
        )}
      </Button>

      <Button
        type="button"
        variant="destructive"
        size="icon"
        onClick={onStop}
        aria-label={t('stop')}
        title={t('stop')}
        className="rounded-full"
      >
        <Square className="size-3.5 fill-current" aria-hidden />
      </Button>
    </div>
  );
}

/** Pulsing dot + label announcing recording state to sighted and AT users. */
function RecordingIndicator({ label, active }: { label: string; active: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18 }}
      className="flex items-center gap-2 pr-1"
      role="status"
      aria-live="polite"
    >
      <span className="relative flex size-2.5 items-center justify-center">
        {active ? (
          <span
            className="absolute inline-flex size-2.5 animate-pulse-ring rounded-full bg-destructive"
            aria-hidden
          />
        ) : null}
        <span
          className={cn(
            'relative inline-flex size-2.5 rounded-full',
            active ? 'bg-destructive' : 'bg-muted-foreground',
          )}
          aria-hidden
        />
      </span>

      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </motion.div>
  );
}

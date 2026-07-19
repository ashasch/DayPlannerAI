'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type SpeechRecognitionStatus = 'unsupported' | 'idle' | 'recording' | 'paused';

/** Errors surfaced to the UI, already mapped onto translation keys. */
export type SpeechErrorKey = 'permissionDenied' | 'noSpeech' | 'error';

interface UseSpeechRecognitionOptions {
  /** BCP-47 tag, e.g. `uk-UA`. Changing it restarts recognition. */
  lang: string;
  /** Called once per finalised phrase. Interim results never reach this. */
  onResult: (transcript: string) => void;
  /** Called when recognition fails in a way worth telling the user about. */
  onError?: (key: SpeechErrorKey) => void;
}

/**
 * Wraps the Web Speech API with start / pause / resume / stop semantics.
 *
 * The underlying API has no notion of pausing, and browsers end a session on
 * their own after a stretch of silence. Both are handled here by tracking the
 * *intent* separately from the engine state: when the engine ends while the
 * user still intends to record, recognition is transparently restarted, so a
 * long brain dump with thinking pauses stays a single continuous session.
 */
export function useSpeechRecognition({ lang, onResult, onError }: UseSpeechRecognitionOptions) {
  const [status, setStatus] = useState<SpeechRecognitionStatus>('idle');
  const [interimTranscript, setInterimTranscript] = useState('');

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  /** What the user wants right now, independent of what the engine is doing. */
  const intentRef = useRef<'recording' | 'paused' | 'stopped'>('stopped');

  // Keep the latest callbacks reachable without re-creating the recognition object.
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  onResultRef.current = onResult;
  onErrorRef.current = onError;

  const isSupported = useRef<boolean | null>(null);
  if (isSupported.current === null && typeof window !== 'undefined') {
    isSupported.current = Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition);
  }

  // Support can only be determined in the browser, so settle the initial state
  // after hydration rather than guessing during render.
  useEffect(() => {
    const supported = Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition);
    isSupported.current = supported;

    if (!supported) setStatus('unsupported');
  }, []);

  /** Builds a configured recognition instance, or `null` if unsupported. */
  const createRecognition = useCallback((): SpeechRecognition | null => {
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) return null;

    const recognition = new Recognition();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interim = '';

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (!result) continue;

        const transcript = result[0]?.transcript ?? '';

        if (result.isFinal) {
          const finalised = transcript.trim();
          if (finalised) onResultRef.current(finalised);
        } else {
          interim += transcript;
        }
      }

      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      // `aborted` is what we ourselves cause on stop/pause — never surface it.
      if (event.error === 'aborted') return;

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        intentRef.current = 'stopped';
        setStatus('idle');
        setInterimTranscript('');
        onErrorRef.current?.('permissionDenied');
        return;
      }

      // Silence is expected during a brain dump; `onend` restarts the session.
      if (event.error === 'no-speech') return;

      intentRef.current = 'stopped';
      setStatus('idle');
      setInterimTranscript('');
      onErrorRef.current?.('error');
    };

    recognition.onend = () => {
      setInterimTranscript('');

      // The engine gave up but the user is still recording — resume silently.
      if (intentRef.current === 'recording') {
        try {
          recognition.start();
        } catch {
          // Already starting; the next `onend` will retry if needed.
        }
      }
    };

    return recognition;
  }, [lang]);

  const start = useCallback(() => {
    if (isSupported.current === false) {
      setStatus('unsupported');
      return;
    }

    recognitionRef.current?.abort();

    const recognition = createRecognition();
    if (!recognition) {
      setStatus('unsupported');
      return;
    }

    recognitionRef.current = recognition;
    intentRef.current = 'recording';

    try {
      recognition.start();
      setStatus('recording');
    } catch {
      intentRef.current = 'stopped';
      setStatus('idle');
      onErrorRef.current?.('error');
    }
  }, [createRecognition]);

  const pause = useCallback(() => {
    if (intentRef.current !== 'recording') return;

    intentRef.current = 'paused';
    recognitionRef.current?.stop();
    setStatus('paused');
  }, []);

  const resume = useCallback(() => {
    if (intentRef.current !== 'paused') return;

    const recognition = recognitionRef.current;
    if (!recognition) {
      start();
      return;
    }

    intentRef.current = 'recording';

    try {
      recognition.start();
      setStatus('recording');
    } catch {
      // The engine had not finished stopping; `onend` picks it up from here.
      setStatus('recording');
    }
  }, [start]);

  const stop = useCallback(() => {
    intentRef.current = 'stopped';
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setInterimTranscript('');
    setStatus(isSupported.current === false ? 'unsupported' : 'idle');
  }, []);

  /** Restart on locale change so dictation follows the UI language. */
  useEffect(() => {
    if (intentRef.current === 'recording') start();
    // `start` is stable per `lang`; re-running on `lang` alone is the intent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // Never leave a live microphone behind on unmount.
  useEffect(
    () => () => {
      intentRef.current = 'stopped';
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    },
    [],
  );

  return {
    status,
    interimTranscript,
    isSupported: status !== 'unsupported',
    isRecording: status === 'recording',
    isPaused: status === 'paused',
    start,
    pause,
    resume,
    stop,
  };
}

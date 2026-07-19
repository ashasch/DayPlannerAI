'use client';

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

interface UseAutoResizeTextareaOptions {
  /** Value to react to. Resizing must happen whenever the content changes. */
  value: string;
  /** Minimum height in pixels. */
  minHeight?: number;
  /** Maximum height in pixels; beyond this the textarea scrolls internally. */
  maxHeight?: number;
}

/**
 * Keeps a textarea exactly as tall as its content.
 *
 * Measurement runs in a layout effect so the browser never paints the old
 * height — without that, growing past a line boundary visibly flickers.
 *
 * @returns A ref to attach to the textarea, plus a manual `resize` trigger.
 */
export function useAutoResizeTextarea({
  value,
  minHeight = 160,
  maxHeight = 480,
}: UseAutoResizeTextareaOptions) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const element = textareaRef.current;
    if (!element) return;

    // Collapse first so `scrollHeight` reflects the content, not the current box.
    element.style.height = 'auto';

    const nextHeight = Math.min(Math.max(element.scrollHeight, minHeight), maxHeight);

    element.style.height = `${nextHeight}px`;
    element.style.overflowY = element.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [minHeight, maxHeight]);

  useLayoutEffect(() => {
    resize();
  }, [value, resize]);

  // A viewport change alters the available width and therefore the wrap points.
  useEffect(() => {
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [resize]);

  return { textareaRef, resize };
}

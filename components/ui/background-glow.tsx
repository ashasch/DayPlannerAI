'use client';

import { useEffect, useRef } from 'react';

/** How far the glow closes toward the cursor each frame (0–1). */
const EASING = 0.09;

/** Below this distance the glow has arrived; stop animating. */
const SETTLE_THRESHOLD_PX = 0.5;

/**
 * Ambient background glow that follows the cursor.
 *
 * Rendered once in the root layout, behind everything, and inert to input.
 *
 * Three deliberate choices around performance:
 *
 * - `mousemove` only records the target. All work happens in a rAF loop, so a
 *   burst of events between two frames costs one assignment each, not one
 *   layout each.
 * - The loop stops once the glow reaches the cursor and restarts on the next
 *   move, instead of spinning at 60fps for the life of the page.
 * - The custom properties are written to this element, not `:root`. On the root
 *   they would invalidate style for every node in the document on every frame.
 */
export function BackgroundGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = glowRef.current;
    if (!element) return;

    // Touch devices have no cursor to follow, and reduced-motion users asked
    // not to be chased. Both fall back to the CSS drift.
    const canFollow = window.matchMedia('(hover: hover) and (pointer: fine)');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (!canFollow.matches || prefersReducedMotion.matches) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight * 0.35;
    let currentX = targetX;
    let currentY = targetY;
    let frame = 0;

    const paint = () => {
      element.style.setProperty('--mouse-x', `${currentX.toFixed(1)}px`);
      element.style.setProperty('--mouse-y', `${currentY.toFixed(1)}px`);
    };

    const tick = () => {
      currentX += (targetX - currentX) * EASING;
      currentY += (targetY - currentY) * EASING;

      paint();

      const settled =
        Math.abs(targetX - currentX) < SETTLE_THRESHOLD_PX &&
        Math.abs(targetY - currentY) < SETTLE_THRESHOLD_PX;

      // Idle: release the loop rather than burn a frame doing nothing.
      frame = settled ? 0 : requestAnimationFrame(tick);
    };

    const handleMouseMove = (event: MouseEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;

      if (!frame) frame = requestAnimationFrame(tick);
    };

    paint();
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      aria-hidden
      // Negative z-index puts it above the page canvas but below all content,
      // so no screen needs a stacking-context change to sit on top of it.
      className="background-glow pointer-events-none fixed inset-0 -z-10"
    />
  );
}

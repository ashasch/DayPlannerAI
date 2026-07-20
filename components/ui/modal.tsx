'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Accessible name for the close button. */
  closeLabel: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * A small centred dialog.
 *
 * Mounted conditionally rather than through `AnimatePresence`: dialogs here
 * contain Radix dropdowns, and nesting those in an exiting presence subtree
 * left the exit never completing — the backdrop stayed mounted at opacity 0,
 * invisibly covering the page and swallowing every click. An enter-only
 * animation avoids that whole class of bug.
 */
export function Modal({
  open,
  onClose,
  title,
  closeLabel,
  description,
  children,
  className,
}: ModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    closeRef.current?.focus();

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl',
          className,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h2 className="text-base font-medium leading-snug">{title}</h2>
            {description ? (
              <p className="text-pretty text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>

          <Button
            ref={closeRef}
            type="button"
            variant="ghost"
            size="icon"
            className="-mr-1 -mt-1 size-8 shrink-0 text-muted-foreground"
            onClick={onClose}
            aria-label={closeLabel}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>

        {children}
      </motion.div>
    </motion.div>
  );
}

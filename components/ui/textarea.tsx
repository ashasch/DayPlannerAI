import * as React from 'react';

import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        'flex w-full rounded-lg border border-input bg-card px-3 py-2 text-base transition-colors',
        'placeholder:text-muted-foreground',
        'focus-visible:border-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'md:text-sm',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

export { Textarea };

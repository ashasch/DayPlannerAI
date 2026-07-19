'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Eye, EyeOff } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps extends Omit<React.ComponentProps<'input'>, 'id'> {
  id: string;
  label: string;
  /** Already-translated error text, or `undefined` when valid. */
  error?: string;
}

/** Labelled input wired up for accessible inline validation. */
export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ id, label, error, className, ...props }, ref) => {
    const errorId = `${id}-error`;

    return (
      <div className="space-y-1.5">
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={className}
          {...props}
        />
        {error ? (
          <p id={errorId} role="alert" className="text-xs text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
FormField.displayName = 'FormField';

/** Password input with a show/hide toggle. */
export const PasswordField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ id, label, error, className, ...props }, ref) => {
    const t = useTranslations('auth.fields');
    const [isVisible, setIsVisible] = React.useState(false);
    const errorId = `${id}-error`;

    return (
      <div className="space-y-1.5">
        <Label htmlFor={id}>{label}</Label>

        <div className="relative">
          <Input
            id={id}
            ref={ref}
            type={isVisible ? 'text' : 'password'}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={cn('pr-11', className)}
            {...props}
          />

          <button
            type="button"
            onClick={() => setIsVisible((visible) => !visible)}
            aria-label={isVisible ? t('hidePassword') : t('showPassword')}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground"
          >
            {isVisible ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
          </button>
        </div>

        {error ? (
          <p id={errorId} role="alert" className="text-xs text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
PasswordField.displayName = 'PasswordField';

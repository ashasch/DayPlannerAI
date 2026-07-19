'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/auth/schemas';
import { AUTH_ROUTES } from '@/lib/auth/routes';
import { ERROR_CODES } from '@/lib/errors';

import { FormField } from './form-field';
import { useAuthMessages } from '../lib/use-auth-messages';

export function ForgotPasswordForm() {
  const t = useTranslations('auth');
  const messages = useAuthMessages();

  /** Set once the request succeeds; swaps the form for a confirmation panel. */
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        toast.error(messages.error(ERROR_CODES.UNKNOWN));
        return;
      }

      // The API answers identically for known and unknown addresses, so the
      // confirmation is deliberately worded as a conditional.
      setSentTo(values.email);
    } catch {
      toast.error(messages.error(ERROR_CODES.UNKNOWN));
    }
  }

  if (sentTo) {
    return (
      <div className="space-y-5 rounded-xl border border-border bg-card p-6 text-center">
        <CheckCircle2 className="mx-auto size-8 text-foreground" aria-hidden />

        <div className="space-y-2">
          <h2 className="text-lg font-medium">{t('forgotPassword.sentTitle')}</h2>
          <p className="text-balance text-sm text-muted-foreground">
            {t('forgotPassword.sentDescription', { email: sentTo })}
          </p>
          <p className="text-xs text-muted-foreground/70">{t('forgotPassword.devLinkNotice')}</p>
        </div>

        <Button asChild variant="outline" className="w-full">
          <Link href={AUTH_ROUTES.login}>{t('forgotPassword.backToLogin')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField
        id="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        label={t('fields.email')}
        placeholder={t('fields.emailPlaceholder')}
        error={messages.validation(errors.email?.message)}
        {...register('email')}
      />

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {t('forgotPassword.submitting')}
          </>
        ) : (
          t('forgotPassword.submit')
        )}
      </Button>
    </form>
  );
}

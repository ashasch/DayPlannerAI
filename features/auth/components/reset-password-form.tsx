'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/auth/schemas';
import { AUTH_ROUTES } from '@/lib/auth/routes';
import { ERROR_CODES } from '@/lib/errors';

import { PasswordField } from './form-field';
import { useAuthMessages } from '../lib/use-auth-messages';

interface ResetPasswordFormProps {
  /** Raw token from the emailed link; empty when the link was malformed. */
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const t = useTranslations('auth');
  const messages = useAuthMessages();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: '', confirmPassword: '' },
  });

  async function onSubmit(values: ResetPasswordInput) {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const code =
          typeof body === 'object' && body !== null && 'error' in body
            ? String((body as { error: unknown }).error)
            : ERROR_CODES.UNKNOWN;

        toast.error(messages.error(code));
        return;
      }

      toast.success(t('resetPassword.success'));
      router.replace(AUTH_ROUTES.login);
    } catch {
      toast.error(messages.error(ERROR_CODES.UNKNOWN));
    }
  }

  // A missing token means the user opened /reset-password directly or the link
  // was truncated — there is nothing to submit, so show the dead end instead.
  if (!token) {
    return (
      <div className="space-y-5 rounded-xl border border-border bg-card p-6 text-center">
        <AlertTriangle className="mx-auto size-8 text-muted-foreground" aria-hidden />

        <div className="space-y-2">
          <h2 className="text-lg font-medium">{t('resetPassword.invalidTokenTitle')}</h2>
          <p className="text-balance text-sm text-muted-foreground">
            {t('resetPassword.invalidTokenDescription')}
          </p>
        </div>

        <Button asChild variant="outline" className="w-full">
          <Link href={AUTH_ROUTES.forgotPassword}>{t('resetPassword.requestNew')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <input type="hidden" {...register('token')} />

      <PasswordField
        id="password"
        autoComplete="new-password"
        label={t('fields.password')}
        placeholder={t('fields.passwordPlaceholder')}
        error={messages.validation(errors.password?.message)}
        {...register('password')}
      />

      <PasswordField
        id="confirmPassword"
        autoComplete="new-password"
        label={t('fields.confirmPassword')}
        error={messages.validation(errors.confirmPassword?.message)}
        {...register('confirmPassword')}
      />

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {t('resetPassword.submitting')}
          </>
        ) : (
          t('resetPassword.submit')
        )}
      </Button>
    </form>
  );
}

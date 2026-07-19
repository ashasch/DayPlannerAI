'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { loginSchema, type LoginInput } from '@/lib/auth/schemas';
import { DEFAULT_SIGNED_IN_REDIRECT } from '@/lib/auth/routes';
import { ERROR_CODES } from '@/lib/errors';

import { FormField, PasswordField } from './form-field';
import { useAuthMessages } from '../lib/use-auth-messages';

export function LoginForm() {
  const t = useTranslations('auth');
  const messages = useAuthMessages();
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginInput) {
    // `redirect: false` keeps the failure case on this page so the error can be
    // rendered inline instead of bouncing through an error query param.
    const result = await signIn('credentials', { ...values, redirect: false });

    if (!result || result.error) {
      toast.error(messages.error(ERROR_CODES.INVALID_CREDENTIALS));
      return;
    }

    toast.success(t('login.success'));

    // Only accept same-origin relative callbacks — never redirect off-site.
    const requested = searchParams.get('callbackUrl');
    const target =
      requested && requested.startsWith('/') && !requested.startsWith('//')
        ? requested
        : DEFAULT_SIGNED_IN_REDIRECT;

    router.replace(target);
    router.refresh();
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

      <PasswordField
        id="password"
        autoComplete="current-password"
        label={t('fields.password')}
        placeholder={t('fields.passwordPlaceholder')}
        error={messages.validation(errors.password?.message)}
        {...register('password')}
      />

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {t('login.submitting')}
          </>
        ) : (
          t('login.submit')
        )}
      </Button>
    </form>
  );
}

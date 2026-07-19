'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { registerSchema, type RegisterInput } from '@/lib/auth/schemas';
import { DEFAULT_SIGNED_IN_REDIRECT } from '@/lib/auth/routes';
import { ERROR_CODES } from '@/lib/errors';

import { FormField, PasswordField } from './form-field';
import { useAuthMessages } from '../lib/use-auth-messages';

export function RegisterForm() {
  const t = useTranslations('auth');
  const messages = useAuthMessages();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  async function onSubmit(values: RegisterInput) {
    try {
      const response = await fetch('/api/auth/register', {
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

        // A taken address belongs on the email field, not in a toast.
        if (code === ERROR_CODES.EMAIL_TAKEN) {
          setError('email', { message: 'emailTaken' });
        }

        toast.error(messages.error(code));
        return;
      }

      // Registration succeeded — sign the new account straight in.
      const signInResult = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (!signInResult || signInResult.error) {
        toast.error(messages.error(ERROR_CODES.UNKNOWN));
        return;
      }

      toast.success(t('register.success'));
      router.replace(DEFAULT_SIGNED_IN_REDIRECT);
      router.refresh();
    } catch {
      toast.error(messages.error(ERROR_CODES.UNKNOWN));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField
        id="name"
        autoComplete="name"
        label={t('fields.name')}
        placeholder={t('fields.namePlaceholder')}
        error={messages.validation(errors.name?.message)}
        {...register('name')}
      />

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
            {t('register.submitting')}
          </>
        ) : (
          t('register.submit')
        )}
      </Button>
    </form>
  );
}

import Link from 'next/link';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { AuthShell } from '@/components/layout/auth-shell';
import { RegisterForm } from '@/features/auth/components/register-form';
import { SocialProviders } from '@/features/auth/components/social-providers';
import { AUTH_ROUTES } from '@/lib/auth/routes';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.register');
  return { title: t('title') };
}

export default async function RegisterPage() {
  const t = await getTranslations('auth');

  return (
    <AuthShell
      title={t('register.title')}
      subtitle={t('register.subtitle')}
      footer={
        <>
          {t('register.hasAccount')}{' '}
          <Link
            href={AUTH_ROUTES.login}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {t('register.loginLink')}
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        <RegisterForm />
        <SocialProviders />
      </div>
    </AuthShell>
  );
}

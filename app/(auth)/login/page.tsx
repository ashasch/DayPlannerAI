import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { AuthShell } from '@/components/layout/auth-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { LoginForm } from '@/features/auth/components/login-form';
import { SocialProviders } from '@/features/auth/components/social-providers';
import { AUTH_ROUTES } from '@/lib/auth/routes';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.login');
  return { title: t('title') };
}

export default async function LoginPage() {
  const t = await getTranslations('auth');

  return (
    <AuthShell
      title={t('login.title')}
      subtitle={t('login.subtitle')}
      footer={
        <>
          {t('login.noAccount')}{' '}
          <Link
            href={AUTH_ROUTES.register}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {t('login.registerLink')}
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        {/* `useSearchParams` in LoginForm requires a Suspense boundary. */}
        <Suspense fallback={<FormSkeleton />}>
          <LoginForm />
        </Suspense>

        <div className="text-center">
          <Link
            href={AUTH_ROUTES.forgotPassword}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {t('login.forgotLink')}
          </Link>
        </div>

        <SocialProviders />
      </div>
    </AuthShell>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

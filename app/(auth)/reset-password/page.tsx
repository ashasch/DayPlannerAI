import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { AuthShell } from '@/components/layout/auth-shell';
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.resetPassword');
  return { title: t('title') };
}

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const t = await getTranslations('auth.resetPassword');
  const { token } = await searchParams;

  return (
    <AuthShell title={t('title')} subtitle={t('subtitle')}>
      <ResetPasswordForm token={token ?? ''} />
    </AuthShell>
  );
}

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { DashboardScreen } from '@/features/dashboard/components/dashboard-screen';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('dashboard');
  return { title: t('title') };
}

export default function DashboardPage() {
  return <DashboardScreen />;
}

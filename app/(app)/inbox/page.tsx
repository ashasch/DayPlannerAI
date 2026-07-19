import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { InboxScreen } from '@/features/tasks/components/inbox-screen';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('inbox');
  return { title: t('title') };
}

export default function InboxPage() {
  return <InboxScreen />;
}

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { CaptureScreen } from '@/features/capture/components/capture-screen';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return { title: t('capture') };
}

/**
 * Capture route.
 *
 * A thin Server Component: the interactive screen is the only Client Component
 * on the page, and access is already guaranteed by the middleware plus the
 * session check in `app/(app)/layout.tsx`.
 */
export default function CapturePage() {
  return <CaptureScreen />;
}

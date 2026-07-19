import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { checkAiHealth } from '@/lib/ai/health';

/** Live check of the Anthropic connection. Signed-in users only. */
export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const health = await checkAiHealth();

  return NextResponse.json(health, {
    // Health is cheap but not free; let the browser reuse it briefly.
    headers: { 'Cache-Control': 'private, max-age=30' },
  });
}

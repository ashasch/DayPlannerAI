import { Skeleton } from '@/components/ui/skeleton';

/** Matches the Capture layout so the transition into it doesn't shift. */
export default function CaptureLoading() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-4 pb-24 pt-10 sm:px-6 sm:pt-16">
      <div className="mb-8 space-y-3">
        <Skeleton className="h-10 w-3/4 sm:h-12" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <Skeleton className="h-4 w-2/3 max-w-md" />
      </div>

      <Skeleton className="h-56 w-full rounded-2xl" />

      <div className="mt-3 flex items-center justify-between">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

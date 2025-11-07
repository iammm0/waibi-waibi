'use client';

import { useEffect } from 'react';
import UniverseStatus from '@/components/universe-status';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <UniverseStatus
        type="error"
        context="default"
        onAction={reset}
        actionLabel="重试"
      />
    </div>
  );
}


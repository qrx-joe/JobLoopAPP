'use client';

import { ErrorGuard } from '@/components/shared/ErrorGuard';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return <ErrorGuard>{children}</ErrorGuard>;
}

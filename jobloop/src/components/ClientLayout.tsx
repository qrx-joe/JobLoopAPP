'use client';

import { ErrorGuard } from '@/components/shared/ErrorGuard';
import { Navbar } from '@/components/Navbar';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorGuard>
      <Navbar />
      {children}
    </ErrorGuard>
  );
}

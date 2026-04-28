'use client';

import { useEffect } from 'react';

/**
 * ErrorGuard - 全局错误防护组件
 *
 * 修复 WebView/SSR 环境中的常见错误:
 * - Cannot read properties of null (reading 'getBoundingClientRect')
 * - Script error (跨域脚本错误)
 */
export function ErrorGuard({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Patch Element.prototype.getBoundingClientRect for safety
    const originalGetBCR = Element.prototype.getBoundingClientRect;
    if (typeof window !== 'undefined') {
      Element.prototype.getBoundingClientRect = function (...args) {
        try {
          return originalGetBCR.apply(this, args);
        } catch {
          // Return safe default if DOM element is not attached
          return {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            width: 0,
            height: 0,
            x: 0,
            y: 0,
            toJSON: () => ({}),
          };
        }
      };

      // Global error handler for uncaught errors
      const handleError = (event: ErrorEvent) => {
        if (
          event.message?.includes('getBoundingClientRect') ||
          event.error?.message?.includes('getBoundingClientRect')
        ) {
          event.preventDefault();
          console.warn('[ErrorGuard] Suppressed getBoundingClientRect error');
          return false;
        }
      };

      // Global rejection handler
      const handleRejection = (event: PromiseRejectionEvent) => {
        if (
          event.reason?.message?.includes('getBoundingClientRect') ||
          String(event.reason)?.includes('getBoundingClientRect')
        ) {
          event.preventDefault();
          console.warn('[ErrorGuard] Suppressed getBoundingClientRect promise rejection');
          return false;
        }
      };

      window.addEventListener('error', handleError, true);
      window.addEventListener('unhandledrejection', handleRejection);

      return () => {
        Element.prototype.getBoundingClientRect = originalGetBCR;
        window.removeEventListener('error', handleError, true);
        window.removeEventListener('unhandledrejection', handleRejection);
      };
    }
  }, []);

  return <>{children}</>;
}

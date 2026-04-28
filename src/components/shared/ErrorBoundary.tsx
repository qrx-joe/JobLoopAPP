'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; reset?: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultFallback;
      return <FallbackComponent error={this.state.error} reset={this.handleReset} />;
    }

    return this.props.children;
  }
}

function DefaultFallback({ error, reset }: { error?: Error; reset?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16">
      <div className="mb-4 text-4xl">😅</div>
      <h2 className="mb-2 text-lg font-semibold text-gray-900">出了点问题</h2>
      <p className="mb-6 max-w-md text-center text-sm text-gray-500">
        {error?.message || '页面发生了未知错误'}
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
      >
        重试
      </button>
    </div>
  );
}

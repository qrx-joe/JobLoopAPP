'use client'

import React from 'react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; reset?: () => void }>
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultFallback
      return <FallbackComponent error={this.state.error} reset={this.handleReset} />
    }

    return this.props.children
  }
}

function DefaultFallback({ error, reset }: { error?: Error; reset?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-4xl mb-4">😅</div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">出了点问题</h2>
      <p className="text-gray-500 text-sm mb-6 max-w-md text-center">
        {error?.message || '页面发生了未知错误'}
      </p>
      <button
        onClick={reset}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        重试
      </button>
    </div>
  )
}

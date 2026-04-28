interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export function LoadingSpinner({ size = 'md', message }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-blue-600 border-t-transparent`}
      />
      {message && <p className="mt-4 text-sm text-gray-500">{message}</p>}
    </div>
  );
}

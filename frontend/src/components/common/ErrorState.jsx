import React from 'react';
import { cn } from '../../utils/formatters';
import { Button } from './Button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while communicating with the FinLearn server.',
  code,
  onRetry,
  className,
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center p-8 rounded-xl border border-red-200 bg-red-50/60 max-w-lg mx-auto my-6', className)}>
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-red-900 mb-1">
        {title}
      </h4>
      <p className="text-sm text-red-700 mb-2 max-w-sm">
        {message}
      </p>
      {code && (
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-red-200/60 text-red-800 mb-4">
          Code: {code}
        </span>
      )}
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={onRetry}
          className="border-red-300 text-red-800 hover:bg-red-100"
        >
          Try Again
        </Button>
      )}
    </div>
  );
}

export default ErrorState;

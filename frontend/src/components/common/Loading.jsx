import React from 'react';
import { cn } from '../../utils/formatters';

export function Loading({
  text = 'Loading financial data...',
  fullPage = false,
  className,
  size = 'md',
}) {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-3 p-6', className)}>
      <div
        className={cn(
          'rounded-full animate-spin border-t-terracotta border-brass/20',
          sizes[size]
        )}
      />
      {text && (
        <p className="text-sm font-medium text-aubergine/70 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center w-full">
        {content}
      </div>
    );
  }

  return content;
}

export default Loading;

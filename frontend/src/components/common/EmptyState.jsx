import React from 'react';
import { cn } from '../../utils/formatters';
import { Button } from './Button';
import { Inbox } from 'lucide-react';

export function EmptyState({
  title = 'No records found',
  description = 'You have not added any records for this section yet.',
  actionLabel,
  onAction,
  icon: Icon = Inbox,
  className,
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center p-8 rounded-xl border border-dashed border-brass/30 bg-ivory-surface/50 max-w-lg mx-auto my-6', className)}>
      <div className="w-12 h-12 rounded-full bg-lilac/30 flex items-center justify-center text-aubergine mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-aubergine mb-1">
        {title}
      </h4>
      <p className="text-sm text-aubergine/70 mb-5 max-w-sm">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;

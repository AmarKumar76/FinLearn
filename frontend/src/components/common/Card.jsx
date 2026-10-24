import React from 'react';
import { cn } from '../../utils/formatters';

export function Card({
  children,
  className,
  title,
  subtitle,
  action,
  headerClassName,
  bodyClassName,
  variant = 'default',
  ...props
}) {
  const variants = {
    default: 'bg-theme-surface border border-theme-border shadow-sm backdrop-blur-sm',
    flat: 'bg-theme-subtle border border-theme-border',
    elevated: 'bg-theme-elevated border border-theme-border-strong shadow-md',
    brand: 'bg-aubergine text-ivory border border-aubergine-light',
  };

  return (
    <div
      className={cn(
        'rounded-xl p-5 transition-colors duration-200',
        variants[variant],
        className
      )}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className={cn('flex items-start justify-between pb-4 mb-4 border-b border-theme-border', headerClassName)}>
          <div>
            {title && (
              <h3 className={cn('text-base font-semibold', variant === 'brand' ? 'text-ivory' : 'text-theme-primary')}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p className={cn('text-xs mt-0.5', variant === 'brand' ? 'text-lilac' : 'text-theme-muted')}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0 ml-3">{action}</div>}
        </div>
      )}
      <div className={bodyClassName}>
        {children}
      </div>
    </div>
  );
}

export default Card;

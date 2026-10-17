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
    default: 'bg-white/70 border border-brass/20 shadow-sm backdrop-blur-sm',
    flat: 'bg-ivory-dark border border-brass/15',
    elevated: 'bg-white border border-brass/25 shadow-md',
    brand: 'bg-aubergine text-ivory border border-aubergine-light',
  };

  return (
    <div
      className={cn(
        'rounded-xl p-5 transition-shadow',
        variants[variant],
        className
      )}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className={cn('flex items-start justify-between pb-4 mb-4 border-b border-brass/10', headerClassName)}>
          <div>
            {title && (
              <h3 className={cn('text-base font-semibold', variant === 'brand' ? 'text-ivory' : 'text-aubergine')}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p className={cn('text-xs mt-0.5', variant === 'brand' ? 'text-lilac' : 'text-aubergine/60')}>
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

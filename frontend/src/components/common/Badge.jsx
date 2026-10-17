import React from 'react';
import { cn } from '../../utils/formatters';

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
  icon: Icon,
  ...props
}) {
  const variants = {
    default: 'bg-ivory-dark text-aubergine border border-brass/20',
    terracotta: 'bg-terracotta/10 text-terracotta border border-terracotta/20',
    aubergine: 'bg-aubergine text-ivory border border-aubergine',
    brass: 'bg-brass/10 text-brass-dark border border-brass/30',
    lilac: 'bg-lilac/30 text-aubergine border border-lilac',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    danger: 'bg-rose-50 text-rose-800 border border-rose-200',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 font-medium rounded',
    md: 'text-xs px-2.5 py-1 font-semibold rounded-md',
    lg: 'text-sm px-3 py-1.5 font-semibold rounded-lg',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 uppercase tracking-wider',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      {children}
    </span>
  );
}

export default Badge;

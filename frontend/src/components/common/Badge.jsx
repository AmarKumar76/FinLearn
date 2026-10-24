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
    default: 'bg-theme-subtle text-theme-primary border border-theme-border',
    terracotta: 'bg-terracotta/15 text-terracotta border border-terracotta/30',
    aubergine: 'bg-theme-sidebar text-theme-sidebar-text border border-theme-sidebar-border',
    brass: 'bg-brass/15 text-brass-dark dark:text-brass-light border border-brass/35',
    lilac: 'bg-lilac/25 text-theme-primary border border-lilac/50',
    success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30',
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

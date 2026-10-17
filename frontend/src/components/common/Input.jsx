import React from 'react';
import { cn } from '../../utils/formatters';

export function Input({
  label,
  error,
  helperText,
  id,
  className,
  type = 'text',
  required = false,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-aubergine uppercase tracking-wider">
          {label}
          {required && <span className="text-terracotta ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        required={required}
        className={cn(
          'w-full px-3.5 py-2.5 rounded-lg border bg-ivory-surface text-aubergine placeholder:text-aubergine/40 text-sm transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent',
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-brass/30 hover:border-brass/60',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-600 font-medium">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-xs text-aubergine/60">{helperText}</p>
      )}
    </div>
  );
}

export default Input;

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
        <label htmlFor={inputId} className="block text-xs font-semibold text-theme-primary uppercase tracking-wider">
          {label}
          {required && <span className="text-terracotta ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type={type}
          required={required}
          className={cn(
            'w-full px-3.5 py-2.5 rounded-lg border bg-theme-surface text-theme-primary placeholder:text-theme-muted text-sm transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-theme-border hover:border-theme-border-strong',
            props.endAdornment ? 'pr-10' : '',
            className
          )}
          {...(() => {
            const { endAdornment, ...rest } = props;
            return rest;
          })()}
        />
        {props.endAdornment && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-auto text-theme-muted hover:text-theme-primary">
            {props.endAdornment}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 font-medium">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-xs text-theme-muted">{helperText}</p>
      )}
    </div>
  );
}

export default Input;

import React from 'react';
import { cn } from '../../utils/formatters';

export function Select({
  label,
  error,
  helperText,
  id,
  className,
  options = [],
  required = false,
  ...props
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-theme-primary uppercase tracking-wider">
          {label}
          {required && <span className="text-terracotta ml-1">*</span>}
        </label>
      )}
      <select
        id={selectId}
        required={required}
        className={cn(
          'w-full px-3.5 py-2.5 rounded-lg border bg-theme-surface text-theme-primary text-sm transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent',
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-theme-border hover:border-theme-border-strong',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-theme-surface text-theme-primary">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      {helperText && !error && <p className="text-xs text-theme-muted">{helperText}</p>}
    </div>
  );
}

export default Select;

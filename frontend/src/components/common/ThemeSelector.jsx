import React from 'react';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/formatters';

export function ThemeSelector({ className, size = 'sm' }) {
  const { theme, setTheme } = useTheme();

  const isSmall = size === 'sm';

  return (
    <div
      role="radiogroup"
      aria-label="Theme selector"
      className={cn(
        'inline-flex items-center p-0.5 rounded-lg border border-theme-border bg-theme-subtle transition-colors shadow-2xs',
        className
      )}
    >
      <button
        type="button"
        role="radio"
        aria-checked={theme === 'light'}
        onClick={() => setTheme('light')}
        className={cn(
          'rounded-md transition-all flex items-center justify-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-terracotta',
          isSmall ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm',
          theme === 'light'
            ? 'bg-theme-surface text-terracotta shadow-xs font-bold ring-1 ring-terracotta/30'
            : 'text-theme-muted hover:text-theme-primary'
        )}
        title="Switch to Light Theme"
        aria-label="Light theme"
      >
        <Sun className={isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        <span className="hidden sm:inline">Light</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={theme === 'dark'}
        onClick={() => setTheme('dark')}
        className={cn(
          'rounded-md transition-all flex items-center justify-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-terracotta',
          isSmall ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm',
          theme === 'dark'
            ? 'bg-theme-surface text-terracotta shadow-xs font-bold ring-1 ring-terracotta/30'
            : 'text-theme-muted hover:text-theme-primary'
        )}
        title="Switch to Dark Theme"
        aria-label="Dark theme"
      >
        <Moon className={isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        <span className="hidden sm:inline">Dark</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={theme === 'amoled'}
        onClick={() => setTheme('amoled')}
        className={cn(
          'rounded-md transition-all flex items-center justify-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-terracotta',
          isSmall ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm',
          theme === 'amoled'
            ? 'bg-theme-surface text-terracotta shadow-xs font-bold ring-1 ring-terracotta/30'
            : 'text-theme-muted hover:text-theme-primary'
        )}
        title="Switch to AMOLED Pure Black Theme"
        aria-label="AMOLED pure black theme"
      >
        <Sparkles className={isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        <span className="hidden sm:inline">AMOLED</span>
      </button>
    </div>
  );
}

export default ThemeSelector;

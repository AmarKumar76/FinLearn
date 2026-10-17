import React from 'react';
import { cn } from '../../utils/formatters';

export function Tabs({ tabs, activeTab, onChange, className }) {
  return (
    <div className={cn('flex items-center gap-1.5 p-1 bg-ivory-dark rounded-xl border border-brass/20 w-fit', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all select-none focus:outline-none focus:ring-2 focus:ring-terracotta',
              isActive
                ? 'bg-terracotta text-white shadow-xs'
                : 'text-aubergine/70 hover:text-aubergine hover:bg-white/60'
            )}
          >
            {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                  isActive ? 'bg-white/20 text-white' : 'bg-brass/20 text-aubergine'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;

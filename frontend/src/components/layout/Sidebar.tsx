import { memo } from 'react';
import { X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { BrandLogo } from '@/components/common/BrandLogo';
import { NAV_ITEMS } from '@/config/navigation';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = memo(function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {isOpen && (
        <div aria-hidden onClick={onClose} className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden" />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <BrandLogo />
          <button type="button" onClick={onClose} aria-label="Close menu" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Main" className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map(({ label, to, icon: Icon, disabled }) =>
            disabled ? (
              <span key={to} aria-disabled className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400">
                <Icon className="h-5 w-5" />
                {label}
                <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase">Soon</span>
              </span>
            ) : (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                    isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100',
                  )
                }
              >
                <Icon className="h-5 w-5" />
                {label}
              </NavLink>
            ),
          )}
        </nav>
      </aside>
    </>
  );
});

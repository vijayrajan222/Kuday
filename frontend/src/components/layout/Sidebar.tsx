import { memo, useState } from 'react';
import {
  X,
  Compass,
  Users,
  MessageSquare,
  User,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { BrandLogo } from '@/components/common/BrandLogo';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { onboardingService } from '@/services/onboardingService';
import { toast } from '@/hooks/useToast';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = memo(function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, updateUser } = useAuth();
  const [switchingRole, setSwitchingRole] = useState(false);

  const role = (user?.role as 'host' | 'seeker') || 'seeker';
  const targetRole = role === 'host' ? 'seeker' : 'host';

  const handleRoleSwitch = async () => {
    if (!user?.id || switchingRole) return;
    try {
      setSwitchingRole(true);
      await onboardingService.updateRole(user.id, targetRole);
      updateUser({ role: targetRole });
      toast.success(
        `Switched to ${targetRole === 'host' ? 'Room Host' : 'Room Seeker'} mode!`
      );
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to switch role');
    } finally {
      setSwitchingRole(false);
    }
  };

  const navLinks = [
    {
      label: 'Discover',
      to: ROUTES.DASHBOARD,
      icon: Compass,
    },
    {
      label: 'Matched',
      to: ROUTES.MATCHED,
      icon: Users,
    },
    {
      label: 'Messages',
      to: '/messages',
      icon: MessageSquare,
      badge: 'Active',
    },
    {
      label: 'Profile & Preferences',
      to: ROUTES.PROFILE,
      icon: User,
    },
  ];

  return (
    <>
      {isOpen && (
        <div
          aria-hidden
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200/90 bg-white transition-transform lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand & Mobile close */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100">
          <BrandLogo />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Role Status Tag */}
        <div className="px-5 pt-4 pb-1">
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-100">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="capitalize">{role === 'host' ? 'Host Mode' : 'Seeker Mode'}</span>
            <span className="ml-auto text-[10px] text-slate-400 font-normal">Active</span>
          </div>
        </div>

        {/* Navigation items */}
        <nav aria-label="Main" className="flex-1 space-y-1.5 px-3 py-3">
          {navLinks.map(({ label, to, icon: Icon, badge }) => (
            <NavLink
              key={label}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-colors',
                  isActive
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
              {badge && (
                <span className="ml-auto rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                  {badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: Role switcher action card */}
        {user && (
          <div className="p-4 border-t border-slate-100">
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                <Sparkles className="h-3 w-3 text-amber-500" />
                <span>Switch Dashboard Role</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Currently browsing as <strong className="capitalize text-slate-600">{role}</strong>.
              </p>
              <button
                type="button"
                disabled={switchingRole}
                onClick={handleRoleSwitch}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 hover:border-slate-300 transition-all shadow-2xs disabled:opacity-50"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', switchingRole && 'animate-spin')} />
                <span>Switch to {targetRole === 'host' ? 'Host' : 'Seeker'}</span>
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
});

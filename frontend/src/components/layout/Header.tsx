import { memo } from 'react';
import { LogOut, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';

interface HeaderProps {
  onMenuClick: () => void;
  onLogout: () => void;
}

export const Header = memo(function Header({ onMenuClick, onLogout }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-8">
      <button type="button" onClick={onMenuClick} aria-label="Open menu" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden">
        <Menu className="h-5 w-5" />
      </button>
      <div className="hidden lg:block" />

      <div className="flex items-center gap-3">
        {user && (
          <Link
            to={ROUTES.PROFILE}
            className="flex items-center gap-2 rounded-full p-1.5 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition-all cursor-pointer"
            title="View Profile"
          >
            <Avatar name={user.firstName || 'User'} size="sm" />
            <span className="hidden text-sm font-semibold sm:block">{user.firstName}</span>
          </Link>
        )}
        <Button variant="outline" size="sm" leftIcon={<LogOut className="h-4 w-4" />} onClick={onLogout}>
          Logout
        </Button>
      </div>
    </header>
  );
});

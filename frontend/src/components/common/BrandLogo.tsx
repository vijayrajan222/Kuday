import { Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  className?: string;
  light?: boolean;
}

export function BrandLogo({ className, light }: BrandLogoProps) {
  return (
    <Link to={ROUTES.HOME} className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/30">
        <Home className="h-5 w-5 text-white" />
      </span>
      <span className={cn('text-xl font-extrabold tracking-tight', light ? 'text-white' : 'text-slate-900')}>
        KUDAY
      </span>
    </Link>
  );
}

import {
  Building2,
  Heart,
  LayoutDashboard,
  MessageSquare,
  UserCircle,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Page not built yet - rendered as "Soon". */
  disabled?: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', to: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: 'Find Roommates', to: '/roommates', icon: Users, disabled: true },
  { label: 'My Listings', to: '/listings', icon: Building2, disabled: true },
  { label: 'Messages', to: '/messages', icon: MessageSquare, disabled: true },
  { label: 'Saved', to: '/saved', icon: Heart, disabled: true },
  { label: 'Profile & Onboarding', to: ROUTES.ONBOARDING_PROFILE, icon: UserCircle },
];

import { createContext } from 'react';
import type { AuthUser, PendingSignup } from '@/types';

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  pendingSignup: PendingSignup | null;
  setPendingSignup: (pending: PendingSignup) => void;
  loginSuccess: (token: string, user: AuthUser) => void;
  updateUser: (updatedUser: Partial<AuthUser>) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AuthContext, type AuthContextValue } from '@/context/authContext';
import { AUTH_UNAUTHORIZED_EVENT } from '@/constants/events';
import type { AuthUser, PendingSignup } from '@/types';
import { storage } from '@/utils/storage';
import { onboardingService } from '@/services/onboardingService';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => storage.getToken());
  const [user, setUser] = useState(() => storage.getUser());
  const [pendingSignup, setPending] = useState(() => storage.getPending());

  const setPendingSignup = useCallback((pending: PendingSignup) => {
    storage.setPending(pending);
    setPending(pending);
  }, []);

  const loginSuccess = useCallback((newToken: string, newUser: AuthUser) => {
    storage.setToken(newToken);
    storage.setUser(newUser);
    storage.setPending(null);
    setToken(newToken);
    setUser(newUser);
    setPending(null);
  }, []);

  const logout = useCallback(() => {
    storage.setToken(null);
    storage.setUser(null);
    storage.setPending(null);
    setToken(null);
    setUser(null);
    setPending(null);
  }, []);

  // Sync user profile from backend whenever user session is present
  useEffect(() => {
    if (user?.id && token) {
      onboardingService
        .getUserProfile(user.id)
        .then((profile) => {
          if (profile) {
            const updatedUser: AuthUser = {
              id: profile.id || user.id,
              email: profile.email || user.email,
              firstName: profile.firstName || user.firstName,
              lastName: profile.lastName || user.lastName,
              dob: profile.dob,
              gender: profile.gender,
              occupation: profile.occupation,
              bio: profile.bio,
              role: profile.role,
              isOnboarded: Boolean(profile.isOnboarded),
              identityVerified: Boolean(profile.identityVerified),
              selfieUrl: profile.selfieUrl,
              idCardUrl: profile.idCardUrl,
            };

            const isDifferent =
              user.isOnboarded !== updatedUser.isOnboarded ||
              user.role !== updatedUser.role ||
              user.identityVerified !== updatedUser.identityVerified ||
              user.firstName !== updatedUser.firstName;

            if (isDifferent) {
              storage.setUser(updatedUser);
              setUser(updatedUser);
            }
          }
        })
        .catch(() => {});
    }
  }, [user, token]);

  // axios interceptor fires this event on 401 -> log out
  useEffect(() => {
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, logout);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, logout);
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, isAuthenticated: Boolean(token), pendingSignup, setPendingSignup, loginSuccess, logout }),
    [user, token, pendingSignup, setPendingSignup, loginSuccess, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

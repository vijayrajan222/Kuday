import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AuthContext, type AuthContextValue } from '@/context/authContext';
import { AUTH_UNAUTHORIZED_EVENT } from '@/constants/events';
import type { AuthUser, PendingSignup } from '@/types';
import { storage } from '@/utils/storage';
import { onboardingService } from '@/services/onboardingService';

const getInitialToken = () => {
  const t = storage.getToken();
  const u = storage.getUser();
  if (t && (!u || !u.id)) {
    storage.setToken(null);
    storage.setUser(null);
    storage.setPending(null);
    return null;
  }
  return t;
};

const getInitialUser = () => {
  const t = storage.getToken();
  const u = storage.getUser();
  if (t && (!u || !u.id)) {
    storage.setToken(null);
    storage.setUser(null);
    storage.setPending(null);
    return null;
  }
  return u;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(getInitialToken);
  const [user, setUser] = useState(getInitialUser);
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

  // Sync user profile from backend once per session (using userId to avoid loop)
  const userId = user?.id;
  useEffect(() => {
    if (userId && token) {
      onboardingService
        .getUserProfile(userId)
        .then((profile) => {
          if (profile) {
            setUser((currentUser) => {
              const updatedUser: AuthUser = {
                id: profile.id || userId,
                email: profile.email || currentUser?.email || '',
                firstName: profile.firstName || currentUser?.firstName || '',
                lastName: profile.lastName || currentUser?.lastName || '',
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
                !currentUser ||
                currentUser.isOnboarded !== updatedUser.isOnboarded ||
                currentUser.role !== updatedUser.role ||
                currentUser.identityVerified !== updatedUser.identityVerified ||
                currentUser.firstName !== updatedUser.firstName ||
                currentUser.lastName !== updatedUser.lastName;

              if (isDifferent) {
                storage.setUser(updatedUser);
                return updatedUser;
              }
              return currentUser;
            });
          }
        })
        .catch((err) => {
          // If session is invalid or user doc doesn't exist, clear session asynchronously
          const status = err?.response?.status;
          if (status === 401 || status === 404 || status === 403) {
            logout();
          }
        });
    }
  }, [userId, token, logout]);

  // axios interceptor fires this event on 401 -> log out
  useEffect(() => {
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, logout);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, logout);
  }, [logout]);

  const isAuthenticated = Boolean(token && user?.id);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, isAuthenticated, pendingSignup, setPendingSignup, loginSuccess, logout }),
    [user, token, isAuthenticated, pendingSignup, setPendingSignup, loginSuccess, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

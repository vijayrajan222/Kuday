import type { AuthUser, PendingSignup } from '@/types';

const KEYS = {
  TOKEN: 'kuday_token',
  USER: 'kuday_user',
  PENDING: 'kuday_pending_signup',
} as const;

const read = (store: Storage, key: string): string | null => {
  try {
    return store.getItem(key);
  } catch {
    return null; // storage blocked (private mode, etc.)
  }
};

const write = (store: Storage, key: string, value: string | null): void => {
  try {
    if (value === null) store.removeItem(key);
    else store.setItem(key, value);
  } catch {
    // ignore quota / access errors
  }
};

const readJson = <T>(store: Storage, key: string): T | null => {
  const raw = read(store, key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const storage = {
  getToken: () => read(localStorage, KEYS.TOKEN),
  setToken: (token: string | null) => write(localStorage, KEYS.TOKEN, token),
  getUser: () => readJson<AuthUser>(localStorage, KEYS.USER),
  setUser: (user: AuthUser | null) => write(localStorage, KEYS.USER, user ? JSON.stringify(user) : null),
  // pending signup lives in sessionStorage so it clears when the tab closes
  getPending: () => readJson<PendingSignup>(sessionStorage, KEYS.PENDING),
  setPending: (p: PendingSignup | null) =>
    write(sessionStorage, KEYS.PENDING, p ? JSON.stringify(p) : null),
};

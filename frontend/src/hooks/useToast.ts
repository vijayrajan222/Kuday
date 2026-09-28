import { useSyncExternalStore } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

const DURATION_MS = 4500;

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => items;

const dismiss = (id: number) => {
  items = items.filter((t) => t.id !== id);
  notify();
};

const push = (variant: ToastVariant, title: string, description?: string) => {
  const id = nextId++;
  items = [...items, { id, title, description, variant }];
  notify();
  window.setTimeout(() => dismiss(id), DURATION_MS);
};

/** Imperative API - usable anywhere (hooks, services, interceptors). */
export const toast = {
  success: (title: string, description?: string) => push('success', title, description),
  error: (title: string, description?: string) => push('error', title, description),
  info: (title: string, description?: string) => push('info', title, description),
  dismiss,
};

export const useToast = () => ({
  toast,
  toasts: useSyncExternalStore(subscribe, getSnapshot),
});

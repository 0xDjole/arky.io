import { showToast } from '../toast.js';

export type SuccessContext<T = any> = {
  data: T;
  method?: string;
  url?: string;
  status?: number;
  request?: any;
  durationMs?: number;
  requestId?: string | null;
};

export type ErrorContext = {
  error: any;
  method?: string;
  url?: string;
  status?: number;
  request?: any;
  response?: any;
  durationMs?: number;
  requestId?: string | null;
  aborted?: boolean;
};

export function onSuccess(message: string, duration?: number) {
  return () => {
    if (message) showToast(message, 'success', duration ?? 3000);
  };
}

export function onError(message: string, duration?: number) {
  return () => {
    if (message) showToast(message, 'error', duration ?? 4000);
  };
}

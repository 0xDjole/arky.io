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

export function onSuccess<T = any>(
  message: string | ((ctx: SuccessContext<T>) => string),
  opts?: { duration?: number; also?: (ctx: SuccessContext<T>) => void | Promise<void> }
) {
  return async (ctx: SuccessContext<T>) => {
    try {
      const msg = typeof message === 'function' ? message(ctx) : message;
      if (msg) showToast(msg, 'success', opts?.duration ?? 3000);
      if (opts?.also) await opts.also(ctx);
    } catch {}
  };
}

export function onError(
  message: string | ((ctx: ErrorContext) => string),
  opts?: { duration?: number; also?: (ctx: ErrorContext) => void | Promise<void> }
) {
  return async (ctx: ErrorContext) => {
    try {
      const msg = typeof message === 'function' ? message(ctx) : message;
      if (msg) showToast(msg, 'error', opts?.duration ?? 4000);
      if (opts?.also) await opts.also(ctx);
    } catch {}
  };
}
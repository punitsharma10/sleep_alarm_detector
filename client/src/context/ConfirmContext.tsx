import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  icon?: LucideIcon;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

interface DialogState extends ConfirmOptions {
  open: boolean;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState>({ open: false });
  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    setState({ ...options, open: true });
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = useCallback((result: boolean) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  // Keyboard: Escape cancels, Enter confirms. Focus the confirm button on open.
  useEffect(() => {
    if (!state.open) return;
    confirmBtnRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
      if (e.key === 'Enter') close(true);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.open, close]);

  const variant = state.variant ?? 'danger';
  const Icon = state.icon ?? AlertTriangle;
  const iconTone =
    variant === 'danger'
      ? 'bg-red-500/15 text-red-500'
      : 'bg-brand-500/15 text-brand-500';

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {createPortal(
        <AnimatePresence>
          {state.open && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={() => close(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ type: 'spring', duration: 0.3, bounce: 0.2 }}
                className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0f172a]"
              >
                <button
                  onClick={() => close(false)}
                  aria-label="Close"
                  className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/5 dark:hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className={`grid h-12 w-12 place-items-center rounded-2xl ${iconTone}`}>
                  <Icon className="h-6 w-6" />
                </div>

                <h2 id="confirm-title" className="mt-4 text-lg font-bold tracking-tight">
                  {state.title ?? 'Are you sure?'}
                </h2>
                {state.description && (
                  <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                    {state.description}
                  </p>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => close(false)}>
                    {state.cancelText ?? 'Cancel'}
                  </Button>
                  <Button
                    ref={confirmBtnRef}
                    variant={variant}
                    onClick={() => close(true)}
                  >
                    {state.confirmText ?? 'Confirm'}
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </ConfirmContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}

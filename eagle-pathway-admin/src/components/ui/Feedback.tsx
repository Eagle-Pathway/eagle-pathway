'use client';
import { createContext, useCallback, useContext, useRef, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface FeedbackContextValue {
  toast: (type: ToastType, message: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function useToast() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useToast must be used within <FeedbackProvider>');
  return ctx.toast;
}

export function useConfirm() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useConfirm must be used within <FeedbackProvider>');
  return ctx.confirm;
}

const TOAST_TONE: Record<ToastType, string> = {
  error: 'bg-red-50 border-red-200 text-red-700',
  success: 'bg-green-50 border-green-200 text-green-700',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
};

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const idRef = useRef(0);

  const toast = useCallback((type: ToastType, message: string) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setDialog({ ...options, resolve })),
    [],
  );

  const closeDialog = (result: boolean) => {
    setDialog((current) => {
      current?.resolve(result);
      return null;
    });
  };

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toast stack */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={`pointer-events-auto px-4 py-3 rounded-xl border shadow-sm text-sm font-medium animate-in fade-in slide-in-from-top-2 ${TOAST_TONE[t.type]}`}
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* Confirmation dialog */}
      {dialog && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4"
          onClick={() => closeDialog(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900">{dialog.title}</h3>
            {dialog.message && <p className="mt-2 text-sm text-gray-600 leading-relaxed">{dialog.message}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => closeDialog(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {dialog.cancelLabel || 'Cancel'}
              </button>
              <button
                onClick={() => closeDialog(true)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${
                  dialog.destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-blue hover:opacity-90'
                }`}
              >
                {dialog.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}

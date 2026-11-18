import type { FC, ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  CheckCircle2,
  Info,
  AlertTriangle,
  AlertCircle,
  X,
} from 'lucide-react';
import '../components/ui/Toast/ToastContainer.css';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
  isExiting?: boolean;
}

export interface ToastOptions {
  type?: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

export interface ToastContextValue {
  show: (options: ToastOptions) => string;
  success: (message: string, title?: string, duration?: number) => string;
  info: (message: string, title?: string, duration?: number) => string;
  warning: (message: string, title?: string, duration?: number) => string;
  error: (message: string, title?: string, duration?: number) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 4000;

export interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t)),
    );

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 250);
  }, []);

  const show = useCallback(
    ({ type = 'info', message, title, duration = DEFAULT_DURATION }: ToastOptions) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = {
        id,
        type,
        message,
        title,
        duration,
        isExiting: false,
      };

      setToasts((prev) => [newToast, ...prev.slice(0, 4)]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }

      return id;
    },
    [dismiss],
  );

  const success = useCallback(
    (message: string, title?: string, duration?: number) =>
      show({ type: 'success', message, title, duration }),
    [show],
  );

  const info = useCallback(
    (message: string, title?: string, duration?: number) =>
      show({ type: 'info', message, title, duration }),
    [show],
  );

  const warning = useCallback(
    (message: string, title?: string, duration?: number) =>
      show({ type: 'warning', message, title, duration }),
    [show],
  );

  const error = useCallback(
    (message: string, title?: string, duration?: number) =>
      show({ type: 'error', message, title, duration }),
    [show],
  );

  const value = useMemo(
    () => ({
      show,
      success,
      info,
      warning,
      error,
      dismiss,
    }),
    [show, success, info, warning, error, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Global Toast Floating Container */}
      <div className="brotar-toast-container" aria-live="polite">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`brotar-toast-card brotar-toast-${item.type} ${item.isExiting ? 'is-exiting' : ''}`}
            role="alert"
          >
            <div className="brotar-toast-icon-wrap">
              {item.type === 'success' && <CheckCircle2 size={20} />}
              {item.type === 'info' && <Info size={20} />}
              {item.type === 'warning' && <AlertTriangle size={20} />}
              {item.type === 'error' && <AlertCircle size={20} />}
            </div>

            <div className="brotar-toast-content">
              {item.title && <h4 className="brotar-toast-title">{item.title}</h4>}
              <p className="brotar-toast-msg">{item.message}</p>
            </div>

            <button
              type="button"
              className="brotar-toast-close-btn"
              onClick={() => dismiss(item.id)}
              aria-label="Cerrar notificación"
            >
              <X size={16} />
            </button>

            {item.duration && item.duration > 0 && (
              <div
                className="brotar-toast-progress-bar"
                style={{ animationDuration: `${item.duration}ms` }}
              />
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

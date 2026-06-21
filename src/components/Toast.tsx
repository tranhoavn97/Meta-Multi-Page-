import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (message: string, title?: string, duration?: number) => void;
  error: (message: string, title?: string, duration?: number) => void;
  warning: (message: string, title?: string, duration?: number) => void;
  info: (message: string, title?: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string, title?: string, duration = 2000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = { id, type, title, message, duration };
    setToasts((prev) => {
      const next = [...prev, newToast];
      return next.slice(-2);
    });

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((message: string, title?: string, duration?: number) => {
    addToast("success", message, title, duration);
  }, [addToast]);

  const error = useCallback((message: string, title?: string, duration?: number) => {
    addToast("error", message, title || "Lỗi", duration);
  }, [addToast]);

  const warning = useCallback((message: string, title?: string, duration?: number) => {
    addToast("warning", message, title || "Cảnh báo", duration);
  }, [addToast]);

  const info = useCallback((message: string, title?: string, duration?: number) => {
    addToast("info", message, title || "Thông báo", duration);
  }, [addToast]);

  const contextValue = useMemo(() => ({
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  }), [toasts, addToast, removeToast, success, error, warning, info]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* Toast Wrapper Portal */}
      <div 
        id="toast-container"
        className="fixed bottom-5 right-5 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastItemComponent key={toast.id} toast={toast} onClose={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastItemComponent({ toast, onClose }: { toast: ToastItem; onClose: (id: string) => void; key?: React.Key }) {
  const { id, type, title, message } = toast;

  const styles = useMemo(() => {
    switch (type) {
      case "success":
        return {
          bg: "bg-[var(--bg-toast)] border-[var(--border-primary)] text-[var(--text-primary)]",
          progressBg: "bg-[var(--accent-green)]",
          icon: <CheckCircle2 className="w-5 h-5 text-[var(--accent-green)] shrink-0" />
        };
      case "error":
        return {
          bg: "bg-[var(--bg-toast)] border-[var(--border-primary)] text-[var(--text-primary)]",
          progressBg: "bg-[var(--accent-red)]",
          icon: <AlertCircle className="w-5 h-5 text-[var(--accent-red)] shrink-0" />
        };
      case "warning":
        return {
          bg: "bg-[var(--bg-toast)] border-[var(--border-primary)] text-[var(--text-primary)]",
          progressBg: "bg-[var(--accent-orange)]",
          icon: <AlertTriangle className="w-5 h-5 text-[var(--accent-orange)] shrink-0" />
        };
      case "info":
      default:
        return {
          bg: "bg-[var(--bg-toast)] border-[var(--border-primary)] text-[var(--text-primary)]",
          progressBg: "bg-[var(--accent-blue)]",
          icon: <Info className="w-5 h-5 text-[var(--accent-blue)] shrink-0" />
        };
    }
  }, [type]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      style={{ originX: 1, originY: 1 }}
      className={`pointer-events-auto relative overflow-hidden flex flex-col w-full border ${styles.bg} backdrop-blur-md rounded-xl p-4 shadow-[var(--shadow-main)]`}
    >
      <div className="flex gap-3 items-start pr-4">
        {styles.icon}
        <div className="flex flex-col gap-1 leading-normal">
          {title && <span className="font-semibold text-sm tracking-wide">{title}</span>}
          <p className="text-xs font-normal text-[var(--text-secondary)]">{message}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onClose(id)}
        className="absolute top-2 right-2 p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors pointer-events-auto"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Decorative timeline visual progress */}
      {toast.duration && toast.duration > 0 ? (
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: toast.duration / 1000, ease: "linear" }}
          className={`absolute bottom-0 left-0 h-0.5 ${styles.progressBg}`}
        />
      ) : null}
    </motion.div>
  );
}

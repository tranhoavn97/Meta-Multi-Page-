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
          bg: "bg-background/70 border-border text-foreground",
          progressBg: "bg-emerald-500",
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        };
      case "error":
        return {
          bg: "bg-background/70 border-border text-foreground",
          progressBg: "bg-rose-500",
          icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
        };
      case "warning":
        return {
          bg: "bg-background/70 border-border text-foreground",
          progressBg: "bg-amber-500",
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
        };
      case "info":
      default:
        return {
          bg: "bg-background/70 border-border text-foreground",
          progressBg: "bg-accent",
          icon: <Info className="w-5 h-5 text-accent shrink-0" />
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
      className={`pointer-events-auto relative overflow-hidden flex flex-col w-full border ${styles.bg} backdrop-blur-2xl rounded-[20px] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]`}
    >
      <div className="flex gap-3 items-start pr-4">
        {styles.icon}
        <div className="flex flex-col gap-1 leading-normal">
          {title && <span className="font-bold text-[13px] tracking-wide">{title}</span>}
          <p className="text-[12px] font-medium text-muted-foreground">{message}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onClose(id)}
        className="absolute top-2 right-2 p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors pointer-events-auto"
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

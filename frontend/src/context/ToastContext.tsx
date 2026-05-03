/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, AlertCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export type ToastVariant = "default" | "success" | "error";

export type ToastOptions = {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastItem = ToastOptions & {
  id: number;
};

type ToastContextValue = {
  showToast: (options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (options: ToastOptions) => {
      const id = ++idRef.current;
      const toast: ToastItem = {
        id,
        title: options.title,
        description: options.description,
        variant: options.variant ?? "default",
        durationMs: options.durationMs ?? 4000,
      };

      setToasts((prev) => [...prev, toast]);

      if (toast.durationMs && toast.durationMs > 0) {
        window.setTimeout(() => dismiss(id), toast.durationMs);
      }
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToastContext must be used within ToastProvider");
  }
  return ctx;
}

type ToasterProps = {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
};

function Toaster({ toasts, onDismiss }: ToasterProps) {
  const container = document.body;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="w-full max-w-sm"
          >
            <ToastCard toast={toast} onDismiss={onDismiss} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    container
  );
}

type ToastCardProps = {
  toast: ToastItem;
  onDismiss: (id: number) => void;
};

function ToastCard({ toast, onDismiss }: ToastCardProps) {
  const { id, title, description, variant = "default" } = toast;

  const variantClasses =
    variant === "success"
      ? "border-emerald-500/70 bg-emerald-500/10 text-emerald-100"
      : variant === "error"
      ? "border-destructive bg-destructive/15 text-destructive-foreground"
      : "border-border bg-card text-card-foreground";

  const Icon =
    variant === "success" ? CheckCircle2 : variant === "error" ? AlertCircle : null;

  return (
    <div
      className={[
        "pointer-events-auto w-full max-w-sm rounded-lg border shadow-md px-4 py-3 text-sm",
        "bg-clip-padding backdrop-blur-sm",
        variantClasses,
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="mt-0.5 flex h-5 w-5 items-center justify-center">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div className="flex-1 space-y-1">
          {title && <p className="text-xs font-semibold uppercase tracking-wide">{title}</p>}
          {description && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-md border border-border/40 bg-background/10 text-xs text-muted-foreground hover:bg-background/30"
          onClick={() => onDismiss(id)}
          aria-label="Dismiss notification"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

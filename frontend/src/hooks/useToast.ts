import { useToastContext } from "@/context/ToastContext";
import type { ToastOptions } from "@/context/ToastContext";

export function useToast() {
  const { showToast } = useToastContext();

  function success(description: string, title = "Success") {
    showToast({ title, description, variant: "success" });
  }

  function error(description: string, title = "Error") {
    showToast({ title, description, variant: "error" });
  }

  return {
    showToast,
    success,
    error,
  } as {
    showToast: (options: ToastOptions) => void;
    success: (description: string, title?: string) => void;
    error: (description: string, title?: string) => void;
  };
}

export type { ToastOptions, ToastVariant } from "@/context/ToastContext";

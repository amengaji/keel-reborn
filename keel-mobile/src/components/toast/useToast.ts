//keel-mobile/src/components/toast/useToast.ts

/**
 * ============================================================
 * useToast Hook
 * ============================================================
 *
 * Simple hook to access the global toast system.
 *
 * EXAMPLE:
 * const toast = useToast();
 * toast.success("Saved successfully");
 */

import { useContext } from "react";
import { ToastContext } from "./ToastProvider";

/**
 * Hook to consume ToastContext safely.
 */
export function useToast() {
  const ctx = useContext(ToastContext);

  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return ctx;
}

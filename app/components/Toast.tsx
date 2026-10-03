"use client";

import React, { useEffect } from "react";

export interface ToastMessage {
  id: number;
  text: string;
  kind: "success" | "error" | "info";
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

/** Small non-blocking notification, bottom-right (replaces alert()) */
export default function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(onDismiss, toast.kind === "error" ? 7000 : 3500);
    return () => clearTimeout(id);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const accent =
    toast.kind === "error"
      ? "border-l-red-500"
      : toast.kind === "success"
        ? "border-l-emerald-500"
        : "border-l-neutral-400";

  return (
    <div
      key={toast.id}
      role={toast.kind === "error" ? "alert" : "status"}
      className={`fixed bottom-4 right-4 left-4 sm:left-auto z-[60] sm:max-w-sm flex items-start gap-3 px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 border-l-4 ${accent} shadow-xl animate-modal-in`}
    >
      <p className="flex-1 text-sm text-neutral-800 dark:text-neutral-200 break-words">{toast.text}</p>
      <button onClick={onDismiss} aria-label="Dismiss" className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

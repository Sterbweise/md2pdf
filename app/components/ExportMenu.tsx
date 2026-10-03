"use client";

import React, { useEffect, useRef, useState } from "react";

export type ExportFormat = "pdf" | "html" | "source" | "print";

interface ExportMenuProps {
  onExport: (format: ExportFormat) => void;
  isExporting: boolean;
  disabled: boolean;
  sourceLabel: string;
}

const items: Array<{ format: ExportFormat; label: string; hint: string; icon: string }> = [
  { format: "pdf", label: "PDF document", hint: "Ctrl+S", icon: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
  { format: "html", label: "HTML page", hint: "Styled, standalone", icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" },
  { format: "source", label: "", hint: "Raw source", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" },
  { format: "print", label: "Print…", hint: "Browser dialog", icon: "M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" },
];

/** "Export PDF" button with a menu for the other export formats */
export default function ExportMenu({ onExport, isExporting, disabled, sourceLabel }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const buttonBase =
    "flex items-center text-xs font-medium text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

  return (
    <div ref={rootRef} className="relative flex ml-1">
      <button onClick={() => onExport("pdf")} disabled={disabled || isExporting} className={`${buttonBase} gap-1.5 px-4 py-1.5`}>
        {isExporting ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="whitespace-nowrap">
              <span className="hidden sm:inline">Export </span>PDF
            </span>
          </>
        )}
      </button>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="More export formats"
        className={`${buttonBase} px-1.5 border-l border-white/20 dark:border-neutral-900/20`}
      >
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 w-56 z-40 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-xl py-1 animate-fade-in"
        >
          {items.map((item) => (
            <button
              key={item.format}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onExport(item.format);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <svg className="w-4 h-4 flex-shrink-0 text-neutral-500 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
              </svg>
              <span className="flex-1 min-w-0">
                <span className="block text-xs font-medium text-neutral-800 dark:text-neutral-200">
                  {item.format === "source" ? sourceLabel : item.label}
                </span>
                <span className="block text-[11px] text-neutral-400 dark:text-neutral-500">{item.hint}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

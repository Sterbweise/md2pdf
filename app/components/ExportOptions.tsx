"use client";

import React, { useEffect } from "react";
import {
  defaultPDFOptions,
  fontFamilyLabels,
  codeFontFamilyLabels,
  pageSizeLabels,
  type PDFOptions,
  type PageSize,
  type FontFamily,
  type CodeFontFamily,
} from "../lib/pdfStyles";

interface ExportOptionsProps {
  options: PDFOptions;
  onChange: (options: PDFOptions) => void;
  isOpen: boolean;
  onClose: () => void;
}

const inputClass =
  "w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 focus:border-transparent transition-colors text-sm";
const smallInputClass =
  "w-full px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 focus:border-transparent";
const labelClass = "block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3">
        {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

function Field({ id, label, hint, children, wide }: { id?: string; label: string; hint?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{hint}</p>}
    </div>
  );
}

function Toggle({ id, label, hint, checked, onChange }: { id: string; label: string; hint?: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-start gap-3">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 flex-shrink-0" />
      <label htmlFor={id} className="text-sm cursor-pointer">
        <span className="font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
        {hint && <span className="block text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{hint}</span>}
      </label>
    </div>
  );
}

/** Two-or-more option button group, styled like the Markdown/HTML switch */
function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: Array<{ value: T; label: string }>; onChange: (value: T) => void; label: string }) {
  return (
    <div className="flex border border-neutral-300 dark:border-neutral-700" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
            value === o.value
              ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
              : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const fontFamilies = Object.keys(fontFamilyLabels) as FontFamily[];
const codeFontFamilies = Object.keys(codeFontFamilyLabels) as CodeFontFamily[];
const pageSizes = Object.keys(pageSizeLabels) as PageSize[];

export default function ExportOptions({ options, onChange, isOpen, onClose }: ExportOptionsProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const set = <K extends keyof PDFOptions>(key: K, value: PDFOptions[K]) => onChange({ ...options, [key]: value });

  const customMargins = options.customMargins ?? { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 };
  const setMargin = (side: keyof typeof customMargins, value: string) =>
    set("customMargins", { ...customMargins, [side]: Math.min(3, Math.max(0, parseFloat(value) || 0)) });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-options-title"
        className="relative bg-white dark:bg-neutral-900 shadow-2xl w-full max-w-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[90dvh] animate-modal-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 id="export-options-title" className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Export Options
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Changes apply to the preview instantly.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 overflow-y-auto">
          <Section title="Page">
            <Field id="pageSize" label="Page Size">
              <select id="pageSize" value={options.pageSize} onChange={(e) => set("pageSize", e.target.value as PageSize)} className={inputClass}>
                {pageSizes.map((size) => (
                  <option key={size} value={size}>
                    {pageSizeLabels[size]}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Orientation">
              <Segmented
                label="Orientation"
                value={options.orientation ?? "portrait"}
                onChange={(v) => set("orientation", v)}
                options={[
                  { value: "portrait", label: "Portrait" },
                  { value: "landscape", label: "Landscape" },
                ]}
              />
            </Field>

            <Field id="margins" label="Margins">
              <select
                id="margins"
                value={options.margins}
                onChange={(e) => {
                  const margins = e.target.value as PDFOptions["margins"];
                  onChange({ ...options, margins, customMargins: margins === "custom" ? customMargins : undefined });
                }}
                className={inputClass}
              >
                <option value="narrow">Narrow (0.5 in)</option>
                <option value="normal">Normal (0.75 in)</option>
                <option value="wide">Wide (1 in)</option>
                <option value="custom">Custom</option>
              </select>
            </Field>

            <Field id="scale" label={`Content Scale · ${Math.round((options.scale ?? 1) * 100)}%`} hint="Shrink to fit more per page, or enlarge.">
              <input
                id="scale"
                type="range"
                min={0.5}
                max={1.5}
                step={0.05}
                value={options.scale ?? 1}
                onChange={(e) => set("scale", parseFloat(e.target.value))}
                className="w-full accent-neutral-900 dark:accent-neutral-100 mt-2"
              />
            </Field>

            {options.margins === "custom" && (
              <div className="sm:col-span-2 pl-4 border-l-2 border-neutral-200 dark:border-neutral-700">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">Margins (inches)</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["top", "right", "bottom", "left"] as const).map((side) => (
                    <div key={side}>
                      <label htmlFor={`margin-${side}`} className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1 capitalize">
                        {side}
                      </label>
                      <input
                        id={`margin-${side}`}
                        type="number"
                        step="0.1"
                        min="0"
                        max="3"
                        value={customMargins[side]}
                        onChange={(e) => setMargin(side, e.target.value)}
                        className={smallInputClass}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>

          <Section title="Typography">
            <Field id="fontFamily" label="Body Font">
              <select id="fontFamily" value={options.fontFamily} onChange={(e) => set("fontFamily", e.target.value as FontFamily)} className={inputClass}>
                {fontFamilies.map((font) => (
                  <option key={font} value={font}>
                    {fontFamilyLabels[font]}
                  </option>
                ))}
              </select>
            </Field>

            <Field id="codeFontFamily" label="Code Font">
              <select id="codeFontFamily" value={options.codeFontFamily} onChange={(e) => set("codeFontFamily", e.target.value as CodeFontFamily)} className={inputClass}>
                {codeFontFamilies.map((font) => (
                  <option key={font} value={font}>
                    {codeFontFamilyLabels[font]}
                  </option>
                ))}
              </select>
            </Field>

            <Field id="fontSize" label="Font Size">
              <select
                id="fontSize"
                value={options.fontSize}
                onChange={(e) => {
                  const fontSize = e.target.value as PDFOptions["fontSize"];
                  onChange({ ...options, fontSize, customFontSize: fontSize === "custom" ? options.customFontSize ?? 12 : undefined });
                }}
                className={inputClass}
              >
                <option value="small">Small (10pt)</option>
                <option value="medium">Medium (11pt)</option>
                <option value="large">Large (12.5pt)</option>
                <option value="custom">Custom</option>
              </select>
              {options.fontSize === "custom" && (
                <input
                  type="number"
                  step="0.5"
                  min="6"
                  max="24"
                  aria-label="Base font size in points"
                  value={options.customFontSize ?? 12}
                  onChange={(e) => set("customFontSize", Math.min(24, Math.max(6, parseFloat(e.target.value) || 12)))}
                  className={`${smallInputClass} mt-2`}
                />
              )}
            </Field>

            <Field id="lineHeight" label="Line Height">
              <select
                id="lineHeight"
                value={options.lineHeight}
                onChange={(e) => {
                  const lineHeight = e.target.value as PDFOptions["lineHeight"];
                  onChange({ ...options, lineHeight, customLineHeight: lineHeight === "custom" ? options.customLineHeight ?? 1.6 : undefined });
                }}
                className={inputClass}
              >
                <option value="compact">Compact (1.4)</option>
                <option value="normal">Normal (1.6)</option>
                <option value="relaxed">Relaxed (1.8)</option>
                <option value="custom">Custom</option>
              </select>
              {options.lineHeight === "custom" && (
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="3"
                  aria-label="Line height multiplier"
                  value={options.customLineHeight ?? 1.6}
                  onChange={(e) => set("customLineHeight", Math.min(3, Math.max(1, parseFloat(e.target.value) || 1.6)))}
                  className={`${smallInputClass} mt-2`}
                />
              )}
            </Field>

            <Field label="Code Blocks">
              <Segmented
                label="Code block theme"
                value={options.codeTheme ?? "dark"}
                onChange={(v) => set("codeTheme", v)}
                options={[
                  { value: "dark", label: "Dark" },
                  { value: "light", label: "Light" },
                ]}
              />
            </Field>

            <div className="flex items-end pb-2">
              <Toggle id="justifyText" label="Justify paragraph text" checked={options.justifyText ?? false} onChange={(v) => set("justifyText", v)} />
            </div>
          </Section>

          <Section title="Header & Footer">
            <Field id="headerText" label="Header Text">
              <input
                id="headerText"
                type="text"
                maxLength={200}
                value={options.headerText ?? ""}
                onChange={(e) => set("headerText", e.target.value || undefined)}
                placeholder="e.g., Company Name"
                className={inputClass}
              />
            </Field>

            <Field id="footerText" label="Footer Text">
              <input
                id="footerText"
                type="text"
                maxLength={200}
                value={options.footerText ?? ""}
                onChange={(e) => set("footerText", e.target.value || undefined)}
                placeholder="e.g., © 2026 Your Company"
                className={inputClass}
              />
            </Field>

            <div className="space-y-3">
              <Toggle id="pageNumbers" label="Page numbers" checked={options.showPageNumbers} onChange={(v) => set("showPageNumbers", v)} />
              {options.showPageNumbers && (
                <select
                  aria-label="Page number format"
                  value={options.pageNumberFormat ?? "fraction"}
                  onChange={(e) => set("pageNumberFormat", e.target.value as PDFOptions["pageNumberFormat"])}
                  className={inputClass}
                >
                  <option value="number">1</option>
                  <option value="fraction">1 / 5</option>
                  <option value="full">Page 1 of 5</option>
                </select>
              )}
            </div>

            <Toggle id="showDate" label="Date in footer" hint="Printed at the bottom right of each page." checked={options.showDate ?? false} onChange={(v) => set("showDate", v)} />
          </Section>

          <Section title="Document">
            <Toggle id="toc" label="Table of contents" hint="Built from H1–H3 headings, with clickable links." checked={options.tableOfContents ?? false} onChange={(v) => set("tableOfContents", v)} />
            <Toggle id="breakH1" label="New page for each H1" hint="Starts every top-level section on its own page." checked={options.pageBreakBeforeH1 ?? false} onChange={(v) => set("pageBreakBeforeH1", v)} />
            <Toggle id="bookmarks" label="PDF bookmarks" hint="Headings appear in the PDF viewer's sidebar." checked={options.bookmarks ?? true} onChange={(v) => set("bookmarks", v)} />
            <Toggle id="linkUrls" label="Show link URLs" hint="Prints the address after each external link." checked={options.showLinkUrls ?? false} onChange={(v) => set("showLinkUrls", v)} />
            <Toggle id="printBackground" label="Print backgrounds" hint="Table stripes, code blocks and callout colors." checked={options.printBackground ?? true} onChange={(v) => set("printBackground", v)} />
          </Section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => onChange(defaultPDFOptions)}
            className="px-3 py-2 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            Reset to defaults
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

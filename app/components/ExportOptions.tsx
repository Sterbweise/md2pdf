"use client";

import React, { useState, useEffect } from "react";
import type {
  PageSize,
  MarginSize,
  FontSize,
  FontFamily,
  CodeFontFamily,
  LineHeight,
  PDFOptions,
} from "../lib/pdfStyles";
import { fontFamilyLabels, codeFontFamilyLabels } from "../lib/pdfStyles";

interface ExportOptionsProps {
  options: PDFOptions;
  onChange: (options: PDFOptions) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportOptions({
  options,
  onChange,
  isOpen,
  onClose,
}: ExportOptionsProps) {
  // Local state for custom values
  const [customMargins, setCustomMargins] = useState({
    top: options.customMargins?.top || 0.75,
    right: options.customMargins?.right || 0.75,
    bottom: options.customMargins?.bottom || 0.75,
    left: options.customMargins?.left || 0.75,
  });
  const [customFontSize, setCustomFontSize] = useState(options.customFontSize || 12);
  const [customLineHeight, setCustomLineHeight] = useState(options.customLineHeight || 1.6);
  const [headerText, setHeaderText] = useState(options.headerText || "");
  const [footerText, setFooterText] = useState(options.footerText || "");

  // Update local state when options change
  useEffect(() => {
    if (options.customMargins) {
      setCustomMargins(options.customMargins);
    }
    if (options.customFontSize) {
      setCustomFontSize(options.customFontSize);
    }
    if (options.customLineHeight) {
      setCustomLineHeight(options.customLineHeight);
    }
    if (options.headerText !== undefined) {
      setHeaderText(options.headerText);
    }
    if (options.footerText !== undefined) {
      setFooterText(options.footerText);
    }
  }, [options]);

  if (!isOpen) return null;

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...options, pageSize: e.target.value as PageSize });
  };

  const handleMarginsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as MarginSize;
    onChange({ 
      ...options, 
      margins: value,
      customMargins: value === "custom" ? customMargins : undefined,
    });
  };

  const handleCustomMarginsChange = (field: keyof typeof customMargins, value: number) => {
    const newMargins = { ...customMargins, [field]: value };
    setCustomMargins(newMargins);
    if (options.margins === "custom") {
      onChange({ ...options, customMargins: newMargins });
    }
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as FontSize;
    onChange({ 
      ...options, 
      fontSize: value,
      customFontSize: value === "custom" ? customFontSize : undefined,
    });
  };

  const handleCustomFontSizeChange = (value: number) => {
    setCustomFontSize(value);
    if (options.fontSize === "custom") {
      onChange({ ...options, customFontSize: value });
    }
  };

  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...options, fontFamily: e.target.value as FontFamily });
  };

  const handleCodeFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...options, codeFontFamily: e.target.value as CodeFontFamily });
  };

  const handleLineHeightChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as LineHeight;
    onChange({ 
      ...options, 
      lineHeight: value,
      customLineHeight: value === "custom" ? customLineHeight : undefined,
    });
  };

  const handleCustomLineHeightChange = (value: number) => {
    setCustomLineHeight(value);
    if (options.lineHeight === "custom") {
      onChange({ ...options, customLineHeight: value });
    }
  };

  const handlePageNumbersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...options, showPageNumbers: e.target.checked });
  };

  const handleHeaderTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHeaderText(value);
    onChange({ ...options, headerText: value || undefined });
  };

  const handleFooterTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFooterText(value);
    onChange({ ...options, footerText: value || undefined });
  };

  const fontFamilies: FontFamily[] = [
    "inter",
    "system",
    "georgia",
    "times",
    "garamond",
    "palatino",
    "helvetica",
    "arial",
    "roboto",
    "mono",
    "jetbrains",
  ];

  const codeFontFamilies: CodeFontFamily[] = [
    "jetbrains",
    "firacode",
    "sourcecodepro",
    "consolas",
    "monaco",
    "menlo",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-neutral-900 shadow-2xl w-full max-w-2xl mx-4 border border-neutral-200 dark:border-neutral-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Export Options
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Page Size */}
              <div>
                <label
                  htmlFor="pageSize"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
                >
                  Page Size
                </label>
                <select
                  id="pageSize"
                  value={options.pageSize}
                  onChange={handlePageSizeChange}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 focus:border-transparent transition-colors text-sm"
                >
                  <option value="A4">A4 (210 × 297 mm)</option>
                  <option value="Letter">Letter (8.5 × 11 in)</option>
                  <option value="Legal">Legal (8.5 × 14 in)</option>
                </select>
              </div>

              {/* Margins */}
              <div>
                <label
                  htmlFor="margins"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
                >
                  Margins
                </label>
                <select
                  id="margins"
                  value={options.margins}
                  onChange={handleMarginsChange}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 focus:border-transparent transition-colors text-sm"
                >
                  <option value="narrow">Narrow (0.5 in)</option>
                  <option value="normal">Normal (0.75 in)</option>
                  <option value="wide">Wide (1 in)</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* Custom Margins */}
              {options.margins === "custom" && (
                <div className="pl-4 border-l-2 border-neutral-200 dark:border-neutral-700 space-y-2">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">Margins (inches)</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Top</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="3"
                        value={customMargins.top}
                        onChange={(e) => handleCustomMarginsChange("top", parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Bottom</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="3"
                        value={customMargins.bottom}
                        onChange={(e) => handleCustomMarginsChange("bottom", parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Left</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="3"
                        value={customMargins.left}
                        onChange={(e) => handleCustomMarginsChange("left", parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Right</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="3"
                        value={customMargins.right}
                        onChange={(e) => handleCustomMarginsChange("right", parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Font Size */}
              <div>
                <label
                  htmlFor="fontSize"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
                >
                  Font Size
                </label>
                <select
                  id="fontSize"
                  value={options.fontSize}
                  onChange={handleFontSizeChange}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 focus:border-transparent transition-colors text-sm"
                >
                  <option value="small">Small (10pt)</option>
                  <option value="medium">Medium (12pt)</option>
                  <option value="large">Large (14pt)</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* Custom Font Size */}
              {options.fontSize === "custom" && (
                <div className="pl-4 border-l-2 border-neutral-200 dark:border-neutral-700">
                  <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                    Base Font Size (pt)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="6"
                    max="24"
                    value={customFontSize}
                    onChange={(e) => handleCustomFontSizeChange(parseFloat(e.target.value) || 12)}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm"
                  />
                </div>
              )}

              {/* Line Height */}
              <div>
                <label
                  htmlFor="lineHeight"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
                >
                  Line Height
                </label>
                <select
                  id="lineHeight"
                  value={options.lineHeight}
                  onChange={handleLineHeightChange}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 focus:border-transparent transition-colors text-sm"
                >
                  <option value="compact">Compact (1.4)</option>
                  <option value="normal">Normal (1.6)</option>
                  <option value="relaxed">Relaxed (1.8)</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* Custom Line Height */}
              {options.lineHeight === "custom" && (
                <div className="pl-4 border-l-2 border-neutral-200 dark:border-neutral-700">
                  <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                    Line Height Multiplier
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="3"
                    value={customLineHeight}
                    onChange={(e) => handleCustomLineHeightChange(parseFloat(e.target.value) || 1.6)}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm"
                  />
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Body Font */}
              <div>
                <label
                  htmlFor="fontFamily"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
                >
                  Body Font
                </label>
                <select
                  id="fontFamily"
                  value={options.fontFamily}
                  onChange={handleFontFamilyChange}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 focus:border-transparent transition-colors text-sm"
                >
                  {fontFamilies.map((font) => (
                    <option key={font} value={font}>
                      {fontFamilyLabels[font]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Code Font */}
              <div>
                <label
                  htmlFor="codeFontFamily"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
                >
                  Code Font
                </label>
                <select
                  id="codeFontFamily"
                  value={options.codeFontFamily}
                  onChange={handleCodeFontFamilyChange}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 focus:border-transparent transition-colors text-sm"
                >
                  {codeFontFamilies.map((font) => (
                    <option key={font} value={font}>
                      {codeFontFamilyLabels[font]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Header Text */}
              <div>
                <label
                  htmlFor="headerText"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
                >
                  Custom Header
                </label>
                <input
                  id="headerText"
                  type="text"
                  value={headerText}
                  onChange={handleHeaderTextChange}
                  placeholder="e.g., Document Title or Company Name"
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 focus:border-transparent transition-colors text-sm"
                />
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Optional header text at top of each page
                </p>
              </div>

              {/* Footer Text */}
              <div>
                <label
                  htmlFor="footerText"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
                >
                  Custom Footer
                </label>
                <input
                  id="footerText"
                  type="text"
                  value={footerText}
                  onChange={handleFooterTextChange}
                  placeholder="e.g., © 2026 Your Company"
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 focus:border-transparent transition-colors text-sm"
                />
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Optional footer text at bottom of each page
                </p>
              </div>

              {/* Page Numbers */}
              <div className="flex items-center pt-2">
                <input
                  id="pageNumbers"
                  type="checkbox"
                  checked={options.showPageNumbers}
                  onChange={handlePageNumbersChange}
                  className="w-4 h-4"
                />
                <label
                  htmlFor="pageNumbers"
                  className="ml-3 text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  Show page numbers
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useCallback, useState, useRef } from "react";
import type { HtmlImageMap } from "@/app/lib/htmlImageEmbedder";
import { importFile, SUPPORTED_IMPORT_EXTENSIONS } from "@/app/lib/fileImport";

interface FileImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileLoad: (
    content: string,
    filename: string,
    imageMap?: HtmlImageMap
  ) => void;
}

export default function FileImportModal({
  isOpen,
  onClose,
  onFileLoad,
}: FileImportModalProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState("");

  const processFile = useCallback(
    async (file: File) => {
      setError("");
      setIsLoading(true);
      try {
        const imported = await importFile(file, setLoadingStatus);
        onFileLoad(imported.content, imported.filename, imported.imageMap);
        onClose();
      } catch (err) {
        console.error("Import error:", err);
        setError(err instanceof Error ? err.message : "Failed to import the file.");
      } finally {
        setIsLoading(false);
        setLoadingStatus("");
      }
    },
    [onFileLoad, onClose]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        processFile(files[0]);
      }
    },
    [processFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
      e.target.value = "";
    },
    [processFile]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-neutral-900 shadow-2xl w-full max-w-lg mx-4 border border-neutral-200 dark:border-neutral-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Import File
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
        <div className="p-6">
          {error && (
            <p role="alert" className="mb-4 px-3 py-2 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500">
              {error}
            </p>
          )}
          <div
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative cursor-pointer border-2 border-dashed p-10 text-center transition-all
              ${
                isDragOver
                  ? "border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-800"
                  : "border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600"
              }
              ${isLoading ? "opacity-50 pointer-events-none" : ""}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={SUPPORTED_IMPORT_EXTENSIONS}
              onChange={handleFileSelect}
              className="hidden"
            />

            {isLoading ? (
              <div className="flex flex-col items-center">
                <svg
                  className="w-8 h-8 animate-spin text-neutral-900 dark:text-neutral-100"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
                  {loadingStatus || "Processing..."}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <svg
                  className={`w-12 h-12 mb-4 ${
                    isDragOver
                      ? "text-neutral-900 dark:text-neutral-100"
                      : "text-neutral-400"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {isDragOver ? "Drop your file here" : "Click or drag to upload"}
                </p>
                <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                  Supports .md, .markdown, .txt, .html, and .zip files
                </p>
              </div>
            )}
          </div>

          {/* ZIP Info */}
          <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-start gap-3">
              <span className="text-lg">📦</span>
              <div>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Notion Export Support
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Handles nested ZIPs (ExportBlock*.zip) automatically. Images are embedded for PDF export.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

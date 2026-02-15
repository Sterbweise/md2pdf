"use client";

import React, { useState, useCallback, useEffect } from "react";

interface NotionImporterProps {
  onImport: (content: string, format: "markdown" | "html") => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function NotionImporter({
  onImport,
  isOpen,
  onClose,
}: NotionImporterProps) {
  const [pageUrl, setPageUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [format, setFormat] = useState<"html" | "markdown">("html");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberKey, setRememberKey] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem("notion_api_key");
    if (savedKey) {
      setApiKey(savedKey);
      setRememberKey(true);
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (!pageUrl.trim()) {
      setError("Please enter a Notion page URL");
      return;
    }

    if (!apiKey.trim()) {
      setError("Please enter your Notion API key");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/notion-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pageUrl: pageUrl.trim(),
          apiKey: apiKey.trim(),
          format,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to import Notion page");
      }

      if (rememberKey) {
        localStorage.setItem("notion_api_key", apiKey);
      } else {
        localStorage.removeItem("notion_api_key");
      }

      const content = format === "html" ? data.html : data.markdown;
      onImport(content, format);
      onClose();
      setPageUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [pageUrl, apiKey, format, rememberKey, onImport, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-neutral-900 shadow-2xl w-full max-w-lg mx-4 border border-neutral-200 dark:border-neutral-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-neutral-700 dark:text-neutral-300"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 2.077c-.373-.28-.886-.467-1.446-.42L3.293 2.66c-.466.047-.56.28-.374.466l1.54 1.082zm.793 3.36v13.589c0 .746.373 1.026 1.213.98l14.29-.84c.84-.046.932-.559.932-1.165V6.77c0-.606-.233-.886-.746-.84l-14.897.84c-.56.047-.792.327-.792.839zm14.104.513c.093.42 0 .84-.42.886l-.7.14v10.033c-.606.327-1.166.514-1.633.514-.746 0-.932-.234-1.492-.933l-4.571-7.186v6.952l1.446.327s0 .84-1.166.84l-3.22.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.16 9.668c-.094-.42.14-1.026.793-1.073l3.453-.233 4.758 7.28V9.108l-1.213-.14c-.093-.513.28-.886.746-.933l3.26-.186zM3.526 1.374l13.44-.98c1.633-.14 2.052.093 2.752.606l3.826 2.754c.56.42.746.56.746 1.12v16.345c0 1.026-.373 1.633-1.679 1.726l-15.259.933c-.98.047-1.446-.093-1.959-.746L1.48 18.51c-.56-.746-.746-1.306-.746-1.959V2.82c0-.84.373-1.353 1.792-1.446z" />
            </svg>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Import from Notion
            </h2>
          </div>
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
        <div className="p-6 space-y-5">
          {/* Instructions */}
          <div className="bg-neutral-50 dark:bg-neutral-800 p-4 border border-neutral-200 dark:border-neutral-700">
            <h3 className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-2">
              How to get your Notion API key:
            </h3>
            <ol className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1 list-decimal list-inside">
              <li>
                Go to{" "}
                <a
                  href="https://www.notion.so/my-integrations"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-neutral-900 dark:hover:text-neutral-200"
                >
                  notion.so/my-integrations
                </a>
              </li>
              <li>Create a new integration</li>
              <li>Copy the Internal Integration Token</li>
              <li>Share the page with your integration</li>
            </ol>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Page URL Input */}
          <div>
            <label
              htmlFor="pageUrl"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
            >
              Notion Page URL
            </label>
            <input
              id="pageUrl"
              type="url"
              value={pageUrl}
              onChange={(e) => setPageUrl(e.target.value)}
              placeholder="https://www.notion.so/your-page-123abc..."
              className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors text-sm"
            />
          </div>

          {/* API Key Input */}
          <div>
            <label
              htmlFor="apiKey"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
            >
              Notion API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="secret_xxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors text-sm"
            />
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
              Export Format
            </label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="format"
                  value="html"
                  checked={format === "html"}
                  onChange={() => setFormat("html")}
                  className="sr-only"
                />
                <span
                  className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                    format === "html"
                      ? "border-neutral-900 dark:border-neutral-100 bg-neutral-900 dark:bg-neutral-100"
                      : "border-neutral-300 dark:border-neutral-600 bg-neutral-200 dark:bg-neutral-700"
                  }`}
                >
                  {format === "html" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-neutral-900" />
                  )}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-700 dark:group-hover:text-neutral-300">
                    HTML <span className="text-xs font-normal text-neutral-500">(Recommended)</span>
                  </div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                    Perfect replica of your Notion page with all formatting preserved
                  </div>
                </div>
              </label>
              
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="format"
                  value="markdown"
                  checked={format === "markdown"}
                  onChange={() => setFormat("markdown")}
                  className="sr-only"
                />
                <span
                  className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                    format === "markdown"
                      ? "border-neutral-900 dark:border-neutral-100 bg-neutral-900 dark:bg-neutral-100"
                      : "border-neutral-300 dark:border-neutral-600 bg-neutral-200 dark:bg-neutral-700"
                  }`}
                >
                  {format === "markdown" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-neutral-900" />
                  )}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-700 dark:group-hover:text-neutral-300">
                    Markdown
                  </div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                    Easy to edit if modifications needed. Some Notion blocks may be adapted or simplified.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Remember Key */}
          <div className="flex items-center">
            <input
              id="rememberKey"
              type="checkbox"
              checked={rememberKey}
              onChange={(e) => setRememberKey(e.target.checked)}
              className="w-4 h-4"
            />
            <label
              htmlFor="rememberKey"
              className="ml-3 text-sm text-neutral-600 dark:text-neutral-400"
            >
              Remember API key in this browser
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-700">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
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
                Importing...
              </>
            ) : (
              "Import Page"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

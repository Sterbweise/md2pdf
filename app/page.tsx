"use client";

import React, { useState, useCallback, useMemo } from "react";
import MarkdownEditor from "./components/MarkdownEditor";
import PreviewPane from "./components/PreviewPane";
import FileImportModal from "./components/FileImportModal";
import ExportOptions from "./components/ExportOptions";
import NotionImporter from "./components/NotionImporter";
import ThankYouModal from "./components/ThankYouModal";
import type { PDFOptions } from "./lib/pdfStyles";
import { embedImagesInHtml, type HtmlImageMap } from "./lib/htmlImageEmbedder";

const defaultMarkdown = `# Welcome to MD to PDF

Convert your **Markdown** and **HTML** to beautifully formatted PDFs.

## Features

- GitHub Flavored Markdown support
- Tables with proper text wrapping
- Syntax highlighted code blocks
- Task lists and more

## Example Table

| Feature | Status |
|---------|--------|
| Tables | Done |
| Code Blocks | Done |
| Images | Done |

## Code Example

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
\`\`\`

## Task List

- [x] Set up project
- [x] Create editor
- [ ] Export your first PDF
`;

const defaultOptions: PDFOptions = {
  pageSize: "A4",
  margins: "normal",
  fontSize: "medium",
  fontFamily: "inter",
  codeFontFamily: "jetbrains",
  lineHeight: "normal",
  showPageNumbers: false,
};

// Configuration - Update these with your actual URLs
const CONFIG = {
  githubRepo: "https://github.com/kmusic/md-to-pdf",
  donationUrl: "https://github.com/sponsors/kmusic",
  linkedIn: "https://www.linkedin.com/in/kchndz/",
  website: "https://kchndz.dev/",
};

type EditorMode = "markdown" | "html";

export default function Home() {
  const [mode, setMode] = useState<EditorMode>("markdown");
  const [markdown, setMarkdown] = useState(defaultMarkdown);
  const [html, setHtml] = useState("");
  const [options, setOptions] = useState<PDFOptions>(defaultOptions);
  const [isExportOptionsOpen, setIsExportOptionsOpen] = useState(false);
  const [isNotionImporterOpen, setIsNotionImporterOpen] = useState(false);
  const [isFileImportOpen, setIsFileImportOpen] = useState(false);
  const [isThankYouOpen, setIsThankYouOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [documentName, setDocumentName] = useState("document");
  const [isEditingName, setIsEditingName] = useState(false);
  const [htmlImageMap, setHtmlImageMap] = useState<HtmlImageMap | null>(null);

  const currentContent = mode === "markdown" ? markdown : html;
  const setCurrentContent = mode === "markdown" ? setMarkdown : setHtml;

  const htmlPreview = useMemo(() => {
    if (mode !== "html") {
      return "";
    }
    return embedImagesInHtml(html, htmlImageMap);
  }, [mode, html, htmlImageMap]);

  const handleFileLoad = useCallback(
    (content: string, filename: string, imageMap?: HtmlImageMap) => {
      const isHtml = filename.toLowerCase().match(/\.(html|htm)$/);
      const baseName = filename.replace(/\.(html|htm|md|markdown|txt)$/i, "");

      if (isHtml) {
        setMode("html");
        setHtml(content);
        setHtmlImageMap(imageMap || null);
      } else {
        setMode("markdown");
        setMarkdown(content);
        setHtmlImageMap(null);
      }
      setDocumentName(baseName || "document");
    },
    [],
  );

  const handleNotionImport = useCallback((content: string) => {
    setMarkdown(content);
    setMode("markdown");
    setHtmlImageMap(null);
  }, []);

  const handleExportPDF = useCallback(async () => {
    if (!currentContent.trim()) {
      alert(`Please enter some ${mode} content first`);
      return;
    }

    setIsExporting(true);

    try {
      const htmlForExport =
        mode === "html"
          ? embedImagesInHtml(currentContent, htmlImageMap)
          : currentContent;

      const response = await fetch("/api/convert-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          markdown: mode === "markdown" ? currentContent : undefined,
          html: mode === "html" ? htmlForExport : undefined,
          mode,
          options,
          filename: `${documentName}.pdf`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate PDF");
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${documentName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Show thank you modal after successful download
      setIsThankYouOpen(true);
    } catch (error) {
      console.error("Export error:", error);
      alert(error instanceof Error ? error.message : "Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  }, [currentContent, mode, options, documentName, htmlImageMap]);

  const handleClear = useCallback(() => {
    if (confirm("Clear the editor?")) {
      if (mode === "markdown") {
        setMarkdown("");
      } else {
        setHtml("");
        setHtmlImageMap(null);
      }
      setDocumentName("document");
    }
  }, [mode]);

  const handleNameSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingName(false);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-neutral-100 dark:bg-neutral-950">
      {/* Header */}
      <header className="flex-shrink-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-screen-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <a href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white dark:text-neutral-900"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  MD to PDF
                </span>
              </a>

              {/* Document Name */}
              <div className="hidden sm:flex items-center gap-2 text-sm text-neutral-500">
                <span>/</span>
                {isEditingName ? (
                  <form
                    onSubmit={handleNameSubmit}
                    className="flex items-center"
                  >
                    <input
                      type="text"
                      value={documentName}
                      onChange={(e) => setDocumentName(e.target.value)}
                      onBlur={() => setIsEditingName(false)}
                      className="px-2 py-1 text-sm bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                      autoFocus
                    />
                  </form>
                ) : (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="px-2 py-1 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    {documentName}
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {/* Mode Toggle */}
              <div className="hidden md:flex items-center border border-neutral-200 dark:border-neutral-700 mr-2">
                <button
                  onClick={() => setMode("markdown")}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    mode === "markdown"
                      ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }`}
                >
                  Markdown
                </button>
                <button
                  onClick={() => setMode("html")}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    mode === "html"
                      ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }`}
                >
                  HTML
                </button>
              </div>

              {/* Import File */}
              <button
                onClick={() => setIsFileImportOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                <span className="hidden sm:inline">Import</span>
              </button>

              {/* Notion Import */}
              <button
                onClick={() => setIsNotionImporterOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 2.077c-.373-.28-.886-.467-1.446-.42L3.293 2.66c-.466.047-.56.28-.374.466l1.54 1.082zm.793 3.36v13.589c0 .746.373 1.026 1.213.98l14.29-.84c.84-.046.932-.559.932-1.165V6.77c0-.606-.233-.886-.746-.84l-14.897.84c-.56.047-.792.327-.792.839zm14.104.513c.093.42 0 .84-.42.886l-.7.14v10.033c-.606.327-1.166.514-1.633.514-.746 0-.932-.234-1.492-.933l-4.571-7.186v6.952l1.446.327s0 .84-1.166.84l-3.22.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.16 9.668c-.094-.42.14-1.026.793-1.073l3.453-.233 4.758 7.28V9.108l-1.213-.14c-.093-.513.28-.886.746-.933l3.26-.186zM3.526 1.374l13.44-.98c1.633-.14 2.052.093 2.752.606l3.826 2.754c.56.42.746.56.746 1.12v16.345c0 1.026-.373 1.633-1.679 1.726l-15.259.933c-.98.047-1.446-.093-1.959-.746L1.48 18.51c-.56-.746-.746-1.306-.746-1.959V2.82c0-.84.373-1.353 1.792-1.446z" />
                </svg>
                <span className="hidden sm:inline">Notion</span>
              </button>

              {/* Options */}
              <button
                onClick={() => setIsExportOptionsOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="hidden sm:inline">Options</span>
              </button>

              {/* Clear */}
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span className="hidden sm:inline">Clear</span>
              </button>

              {/* Export PDF */}
              <button
                onClick={handleExportPDF}
                disabled={isExporting || !currentContent.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ml-1"
              >
                {isExporting ? (
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
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    <span>Export PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Mode Toggle */}
      <div className="md:hidden flex items-center justify-center py-2 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center border border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => setMode("markdown")}
            className={`px-4 py-1.5 text-xs font-medium transition-colors ${
              mode === "markdown"
                ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                : "text-neutral-600 dark:text-neutral-400"
            }`}
          >
            Markdown
          </button>
          <button
            onClick={() => setMode("html")}
            className={`px-4 py-1.5 text-xs font-medium transition-colors ${
              mode === "html"
                ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                : "text-neutral-600 dark:text-neutral-400"
            }`}
          >
            HTML
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-screen-2xl mx-auto p-4">
          <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
            {/* Left Column - Editor */}
            <div className="min-h-0 h-full min-w-0">
              <MarkdownEditor
                value={currentContent}
                onChange={setCurrentContent}
                mode={mode}
                placeholder={
                  mode === "markdown"
                    ? "# Start typing your markdown here...\n\nSupports **bold**, *italic*, `code`, tables, and more!"
                    : "<!DOCTYPE html>\n<html>\n<head>\n  <title>Document</title>\n</head>\n<body>\n  <h1>Your HTML content here</h1>\n</body>\n</html>"
                }
              />
            </div>

            {/* Right Column - Preview */}
            <div className="min-h-0 h-full min-w-0">
              <PreviewPane
                markdown={mode === "html" ? htmlPreview : currentContent}
                mode={mode}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="max-w-screen-2xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            {/* Left side - Credits */}
            <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
              <span>
                Made by{" "}
                <a
                  href={CONFIG.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-700 dark:text-neutral-300 hover:underline"
                >
                  kchndz.dev
                </a>
              </span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">MIT License</span>
            </div>

            {/* Right side - Links */}
            <div className="flex items-center gap-3">
              {/* GitHub */}
              <a
                href={CONFIG.githubRepo}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span className="hidden sm:inline">GitHub</span>
              </a>

              {/* LinkedIn */}
              <a
                href={CONFIG.linkedIn}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                <span className="hidden sm:inline">LinkedIn</span>
              </a>

              {/* Sponsor/Donate */}
              <a
                href={CONFIG.donationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2 py-1 text-xs text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span>Sponsor</span>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ExportOptions
        options={options}
        onChange={setOptions}
        isOpen={isExportOptionsOpen}
        onClose={() => setIsExportOptionsOpen(false)}
      />

      <NotionImporter
        onImport={handleNotionImport}
        isOpen={isNotionImporterOpen}
        onClose={() => setIsNotionImporterOpen(false)}
      />

      <FileImportModal
        isOpen={isFileImportOpen}
        onClose={() => setIsFileImportOpen(false)}
        onFileLoad={handleFileLoad}
      />

      <ThankYouModal
        isOpen={isThankYouOpen}
        onClose={() => setIsThankYouOpen(false)}
        githubRepo={CONFIG.githubRepo}
        donationUrl={CONFIG.donationUrl}
      />
    </div>
  );
}

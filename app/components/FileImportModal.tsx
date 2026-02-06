"use client";

import React, { useCallback, useState, useRef } from "react";
import JSZip from "jszip";
import type { HtmlImageMap } from "@/app/lib/htmlImageEmbedder";

interface FileImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileLoad: (
    content: string,
    filename: string,
    imageMap?: HtmlImageMap
  ) => void;
}

interface ExtractedContent {
  htmlFiles: Array<{ path: string; content: string }>;
  mdFiles: Array<{ path: string; content: string }>;
  images: HtmlImageMap;
}

// Helper to check if a path should be ignored
function shouldIgnorePath(path: string): boolean {
  return (
    path.startsWith("__MACOSX") ||
    path.startsWith(".") ||
    path.includes("/__MACOSX/") ||
    path.includes("/.")
  );
}

// Helper to get MIME type from extension
function getMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    webp: "image/webp",
    bmp: "image/bmp",
    ico: "image/x-icon",
  };
  return mimeTypes[ext.toLowerCase()] || "image/png";
}

// Helper to add image aliases for various path formats
function addImageAliases(
  imageMap: HtmlImageMap,
  relativePath: string,
  dataUri: string
) {
  const fileName = relativePath.split("/").pop() || relativePath;
  const pathWithoutLeadingDot = relativePath.replace(/^\.\//, "");
  
  // Add all possible path variations that might be used in HTML/MD
  const aliases = [
    relativePath,
    pathWithoutLeadingDot,
    fileName,
    `./${relativePath}`,
    `./${pathWithoutLeadingDot}`,
    encodeURIComponent(fileName),
    encodeURIComponent(relativePath),
    decodeURIComponent(fileName),
    decodeURIComponent(relativePath),
  ];

  aliases.forEach((alias) => {
    if (alias && !imageMap[alias]) {
      imageMap[alias] = dataUri;
    }
  });
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

  /**
   * Extract content from a JSZip instance
   * Handles nested ZIPs (like Notion's ExportBlock*.zip files)
   */
  const extractZipContent = useCallback(
    async (zip: JSZip, basePath: string = ""): Promise<ExtractedContent> => {
      const result: ExtractedContent = {
        htmlFiles: [],
        mdFiles: [],
        images: {},
      };

      const nestedZips: Array<{ path: string; data: ArrayBuffer }> = [];
      const filePromises: Promise<void>[] = [];

      // First pass: identify all files and nested ZIPs
      zip.forEach((relativePath, zipEntry) => {
        if (zipEntry.dir || shouldIgnorePath(relativePath)) {
          return;
        }

        const fullPath = basePath ? `${basePath}/${relativePath}` : relativePath;
        const lowerPath = relativePath.toLowerCase();

        // Check for nested ZIP files (Notion exports have ExportBlock*.zip)
        if (lowerPath.endsWith(".zip")) {
          filePromises.push(
            (async () => {
              try {
                setLoadingStatus(`Extracting ${relativePath}...`);
                const data = await zipEntry.async("arraybuffer");
                nestedZips.push({ path: fullPath, data });
              } catch (err) {
                console.warn(`Failed to read nested ZIP ${relativePath}:`, err);
              }
            })()
          );
          return;
        }

        // HTML files
        if (lowerPath.endsWith(".html") || lowerPath.endsWith(".htm")) {
          filePromises.push(
            (async () => {
              try {
                const content = await zipEntry.async("text");
                result.htmlFiles.push({ path: fullPath, content });
              } catch (err) {
                console.warn(`Failed to read HTML ${relativePath}:`, err);
              }
            })()
          );
          return;
        }

        // Markdown files
        if (
          lowerPath.endsWith(".md") ||
          lowerPath.endsWith(".markdown") ||
          lowerPath.endsWith(".txt")
        ) {
          filePromises.push(
            (async () => {
              try {
                const content = await zipEntry.async("text");
                result.mdFiles.push({ path: fullPath, content });
              } catch (err) {
                console.warn(`Failed to read Markdown ${relativePath}:`, err);
              }
            })()
          );
          return;
        }

        // Image files
        if (/\.(png|jpe?g|gif|svg|webp|bmp|ico)$/i.test(relativePath)) {
          filePromises.push(
            (async () => {
              try {
                const imageData = await zipEntry.async("base64");
                const ext = relativePath.split(".").pop()?.toLowerCase() || "png";
                const mimeType = getMimeType(ext);
                const dataUri = `data:${mimeType};base64,${imageData}`;
                addImageAliases(result.images, fullPath, dataUri);
                // Also add without base path for relative references
                if (basePath) {
                  addImageAliases(result.images, relativePath, dataUri);
                }
              } catch (err) {
                console.warn(`Failed to process image ${relativePath}:`, err);
              }
            })()
          );
        }
      });

      // Wait for all files to be processed
      await Promise.all(filePromises);

      // Process nested ZIPs recursively
      for (const nestedZip of nestedZips) {
        try {
          setLoadingStatus(`Processing ${nestedZip.path.split("/").pop()}...`);
          const innerZip = await JSZip.loadAsync(nestedZip.data);
          const nestedContent = await extractZipContent(
            innerZip,
            nestedZip.path.replace(/\.zip$/i, "")
          );

          // Merge nested content
          result.htmlFiles.push(...nestedContent.htmlFiles);
          result.mdFiles.push(...nestedContent.mdFiles);
          Object.assign(result.images, nestedContent.images);
        } catch (err) {
          console.warn(`Failed to process nested ZIP ${nestedZip.path}:`, err);
        }
      }

      return result;
    },
    []
  );

  /**
   * Process a ZIP file and extract the best content
   */
  const processZipFile = useCallback(
    async (file: File): Promise<void> => {
      try {
        setLoadingStatus("Reading ZIP file...");
        const zip = await JSZip.loadAsync(file);

        setLoadingStatus("Extracting contents...");
        const content = await extractZipContent(zip);

        // Determine what to load: prefer HTML, fall back to Markdown
        let selectedFile: { path: string; content: string } | null = null;
        let isHtml = false;

        if (content.htmlFiles.length > 0) {
          // Prefer index.html or root-level HTML
          selectedFile =
            content.htmlFiles.find(
              (f) =>
                f.path.toLowerCase().includes("index") ||
                !f.path.includes("/")
            ) || content.htmlFiles[0];
          isHtml = true;
        } else if (content.mdFiles.length > 0) {
          // Prefer README.md or root-level markdown
          selectedFile =
            content.mdFiles.find(
              (f) =>
                f.path.toLowerCase().includes("readme") ||
                !f.path.includes("/")
            ) || content.mdFiles[0];
          isHtml = false;
        }

        if (!selectedFile) {
          alert(
            "No HTML or Markdown files found in the ZIP archive.\n\n" +
              "Make sure your ZIP contains .html, .htm, .md, .markdown, or .txt files."
          );
          return;
        }

        const displayName =
          selectedFile.path.split("/").pop() || "document" + (isHtml ? ".html" : ".md");

        setLoadingStatus("Loading document...");
        onFileLoad(
          selectedFile.content,
          displayName,
          Object.keys(content.images).length > 0 ? content.images : undefined
        );
        onClose();
      } catch (error) {
        console.error("Error processing ZIP file:", error);
        alert(
          "Failed to process the ZIP file.\n\n" +
            "Please ensure it's a valid ZIP containing HTML or Markdown files."
        );
      }
    },
    [extractZipContent, onFileLoad, onClose]
  );

  const processFile = useCallback(
    async (file: File) => {
      const fileName = file.name.toLowerCase();
      const isMarkdown =
        fileName.endsWith(".md") ||
        fileName.endsWith(".markdown") ||
        fileName.endsWith(".txt");
      const isHtml = fileName.endsWith(".html") || fileName.endsWith(".htm");
      const isZip = fileName.endsWith(".zip");

      if (!isMarkdown && !isHtml && !isZip) {
        alert(
          "Please upload a Markdown (.md, .markdown, .txt), HTML (.html, .htm), or ZIP (.zip) file"
        );
        return;
      }

      setIsLoading(true);
      setLoadingStatus("Reading file...");
      try {
        if (isZip) {
          await processZipFile(file);
        } else {
          const content = await file.text();
          onFileLoad(content, file.name);
          onClose();
        }
      } catch (error) {
        console.error("Error reading file:", error);
        alert("Failed to read the file. Please try again.");
      } finally {
        setIsLoading(false);
        setLoadingStatus("");
      }
    },
    [onFileLoad, processZipFile, onClose]
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
              accept=".md,.markdown,.txt,.html,.htm,.zip"
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

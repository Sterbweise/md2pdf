import JSZip from "jszip";
import type { HtmlImageMap } from "./htmlImageEmbedder";

export interface ImportedFile {
  content: string;
  /** Name of the loaded document file (e.g. "notes.md") */
  filename: string;
  imageMap?: HtmlImageMap;
}

export const SUPPORTED_IMPORT_EXTENSIONS = ".md,.markdown,.txt,.html,.htm,.zip";

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

/**
 * Extract content from a JSZip instance
 * Handles nested ZIPs (like Notion's ExportBlock*.zip files)
 */
async function extractZipContent(
  zip: JSZip,
  basePath: string,
  onStatus: (status: string) => void
): Promise<ExtractedContent> {
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
            onStatus(`Extracting ${relativePath}...`);
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
      onStatus(`Processing ${nestedZip.path.split("/").pop()}...`);
      const innerZip = await JSZip.loadAsync(nestedZip.data);
      const nestedContent = await extractZipContent(
        innerZip,
        nestedZip.path.replace(/\.zip$/i, ""),
        onStatus
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
}

/** Pick the main document of a ZIP: prefer HTML (index/root), then Markdown (README/root) */
async function importZip(file: File, onStatus: (status: string) => void): Promise<ImportedFile> {
  onStatus("Reading ZIP file...");
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    throw new Error("Failed to read the ZIP file. Please ensure it's a valid ZIP archive.");
  }

  onStatus("Extracting contents...");
  const content = await extractZipContent(zip, "", onStatus);

  let selectedFile: { path: string; content: string } | undefined;
  let isHtml = false;
  if (content.htmlFiles.length > 0) {
    selectedFile =
      content.htmlFiles.find((f) => f.path.toLowerCase().includes("index") || !f.path.includes("/")) ||
      content.htmlFiles[0];
    isHtml = true;
  } else if (content.mdFiles.length > 0) {
    selectedFile =
      content.mdFiles.find((f) => f.path.toLowerCase().includes("readme") || !f.path.includes("/")) ||
      content.mdFiles[0];
  }

  if (!selectedFile) {
    throw new Error(
      "No HTML or Markdown files found in the ZIP archive. Make sure it contains .html, .htm, .md, .markdown or .txt files."
    );
  }

  onStatus("Loading document...");
  return {
    content: selectedFile.content,
    filename: selectedFile.path.split("/").pop() || (isHtml ? "document.html" : "document.md"),
    imageMap: Object.keys(content.images).length > 0 ? content.images : undefined,
  };
}

/**
 * Read a Markdown, HTML, text or ZIP file. Throws an Error with a
 * user-facing message when the file is unsupported or unreadable.
 */
export async function importFile(
  file: File,
  onStatus: (status: string) => void = () => {}
): Promise<ImportedFile> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".zip")) return importZip(file, onStatus);
  if (!/\.(md|markdown|txt|html|htm)$/.test(name)) {
    throw new Error("Unsupported file. Use a Markdown (.md, .markdown, .txt), HTML (.html, .htm) or ZIP (.zip) file.");
  }
  onStatus("Reading file...");
  try {
    return { content: await file.text(), filename: file.name };
  } catch {
    throw new Error("Failed to read the file. Please try again.");
  }
}

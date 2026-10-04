import puppeteer, {
  type Browser,
  type Page,
  type PDFOptions as PuppeteerPDFOptions,
} from "puppeteer";
import fs from "fs";
import { buildDocument } from "./documentBuilder";
import {
  getMargins,
  fontFamilyPresets,
  withFallbackFonts,
  type PDFOptions,
} from "./pdfStyles";

/**
 * Fetch a remote image URL and return as base64 data URI.
 * Used to embed Notion/remote images in HTML before PDF generation.
 */
async function fetchImageAsBase64(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MD2PDF/1.0)",
        "Accept": "image/*",
      },
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return url;
    const buf = await res.arrayBuffer();
    const base64 = Buffer.from(buf).toString("base64");
    const rawType = res.headers.get("content-type") || "image/png";
    const contentType = rawType.split(";")[0]?.trim() || "image/png";
    return `data:${contentType};base64,${base64}`;
  } catch {
    return url;
  }
}

/**
 * Embed remote (http/https) images in HTML as base64 data URIs.
 * Ensures Notion and other remote images render in PDF export.
 */
async function embedRemoteImagesInHtml(html: string): Promise<string> {
  const imgRegex = /<img([^>]+)src=(["'])(https?:\/\/[^"']+)\2([^>]*)>/gi;
  const matches = [...html.matchAll(imgRegex)];
  if (matches.length === 0) return html;

  const parts: string[] = [];
  let lastIndex = 0;
  for (const match of matches) {
    const [full, before, , url, after] = match;
    const matchIndex = match.index ?? 0;
    parts.push(html.slice(lastIndex, matchIndex));
    if (url.startsWith("data:")) {
      parts.push(full);
    } else {
      const dataUri = await fetchImageAsBase64(url);
      parts.push(`<img${before}src="${dataUri}"${after}>`);
    }
    lastIndex = matchIndex + full.length;
  }
  parts.push(html.slice(lastIndex));
  return parts.join("");
}

// Singleton browser instance for better performance
let browserInstance: Browser | null = null;
// Pending launch, shared so concurrent requests don't start several browsers
let browserLaunch: Promise<Browser> | null = null;

// Helper to escape HTML for safe injection
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Find Chrome executable path based on OS
async function findChromePath(): Promise<string | undefined> {
  const candidates: (string | undefined)[] = [];

  // 1. Explicit override via the standard puppeteer environment variable
  candidates.push(process.env["PUPPETEER_EXECUTABLE_PATH"]);

  // 2. Puppeteer's own pinned browser in its cache directory.
  //    If the cache is missing, or a previous download was interrupted
  //    and left a folder without the actual binary, the path simply
  //    won't exist and we fall through to system browsers instead of
  //    failing the whole render with "Could not find Chrome".
  try {
    candidates.push(await puppeteer.executablePath());
  } catch {
    // Puppeteer has no resolvable browser path - fall through
  }

  // 3. Well-known system locations per OS
  const isWindows = process.platform === "win32";
  const isMac = process.platform === "darwin";
  if (isWindows) {
    candidates.push(
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      process.env["LOCALAPPDATA"] + "\\Google\\Chrome\\Application\\chrome.exe",
      process.env["USERPROFILE"] +
        "\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe",
      // Edge as fallback (Chromium-based)
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
      process.env["PROGRAMFILES"] + "\\Microsoft\\Edge\\Application\\msedge.exe",
      process.env["PROGRAMFILES(X86)"] +
        "\\Microsoft\\Edge\\Application\\msedge.exe",
    );
  } else if (isMac) {
    candidates.push(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    );
  } else {
    // Linux
    candidates.push(
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser",
      "/usr/bin/microsoft-edge",
      "/snap/bin/chromium",
      "/opt/google/chrome/chrome",
    );
  }

  console.log("Searching for Chrome/Chromium/Edge in the following locations:");
  for (const chromePath of candidates) {
    if (chromePath) {
      console.log(`  - ${chromePath}`);
      try {
        if (fs.existsSync(chromePath)) {
          console.log(`  ✓ Found browser at: ${chromePath}`);
          return chromePath;
        }
      } catch {
        // Ignore errors
      }
    }
  }
  console.log("  ✗ No system Chrome/Chromium/Edge found");
  return undefined;
}

async function getBrowser(): Promise<Browser> {
  if (browserInstance?.connected) return browserInstance;
  if (!browserLaunch) {
    browserLaunch = launchBrowser().finally(() => {
      browserLaunch = null;
    });
  }
  browserInstance = await browserLaunch;
  return browserInstance;
}

async function launchBrowser(): Promise<Browser> {
  const executablePath = await findChromePath();

  const launchOptions = {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--font-render-hinting=none",
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process",
    ],
  };

  try {
    if (executablePath) {
      console.log(`Attempting to launch Chrome from: ${executablePath}`);
      return await puppeteer.launch({
        ...launchOptions,
        executablePath,
      });
    }
    console.log("No system Chrome found, using default Puppeteer browser");
    return await puppeteer.launch(launchOptions);
  } catch (error) {
    console.error("Failed to launch browser:", error);

    // Final fallback: try with minimal args
    console.log("Retrying with minimal configuration...");
    return puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      ...(executablePath ? { executablePath } : {}),
    });
  }
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

/**
 * Build Puppeteer header/footer templates.
 * Footer layout: custom text (left) · page number (center) · date (right).
 */
function buildHeaderFooter(
  options: PDFOptions,
  fontStack: string
): { headerTemplate: string; footerTemplate: string } | null {
  const hasFooter = options.showPageNumbers || options.footerText || options.showDate;
  if (!hasFooter && !options.headerText) return null;

  const base = `width: 100%; font-size: 9px; color: #666; padding: 0 0.5in; font-family: ${fontStack};`;

  const headerTemplate = options.headerText
    ? `<div style="${base} text-align: center;"><span>${escapeHtml(options.headerText)}</span></div>`
    : "<span></span>";

  let pageNumber = "";
  if (options.showPageNumbers) {
    const current = `<span class="pageNumber"></span>`;
    const total = `<span class="totalPages"></span>`;
    pageNumber =
      options.pageNumberFormat === "number"
        ? current
        : options.pageNumberFormat === "full"
          ? `Page ${current} of ${total}`
          : `${current} / ${total}`;
  }

  const footerTemplate = hasFooter
    ? `<div style="${base} display: flex; align-items: center;">
        <span style="flex: 1; text-align: left;">${options.footerText ? escapeHtml(options.footerText) : ""}</span>
        <span style="flex: 1; text-align: center;">${pageNumber}</span>
        <span style="flex: 1; text-align: right;">${options.showDate ? `<span class="date"></span>` : ""}</span>
      </div>`
    : "<span></span>";

  return { headerTemplate, footerTemplate };
}

/**
 * Wait until images and web fonts are ready, without ever hanging the export.
 */
async function waitForAssets(page: Page, timeoutMs: number): Promise<void> {
  const ready = page.evaluate(async () => {
    const images = Array.from(document.images).filter((img) => !img.complete);
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
          })
      )
    );
    await document.fonts.ready;
  });
  await Promise.race([
    ready.catch(() => undefined),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

/**
 * Generate PDF from markdown or HTML content
 * @param documentTitle - Override for the HTML <title> tag (e.g. document filename)
 */
export async function generatePDF(
  content: string,
  options: PDFOptions,
  mode: "markdown" | "html" = "markdown",
  documentTitle?: string
): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Embed remote (e.g. Notion) images as base64 so they render in the PDF
    const source = mode === "html" ? await embedRemoteImagesInHtml(content) : content;
    const { html, lang } = await buildDocument(source, options, mode, documentTitle);

    // "load" waits for stylesheets (web fonts) and images; a slow remote
    // resource must not fail the export, so a timeout just moves on.
    try {
      await page.setContent(html, { waitUntil: "load", timeout: 20000 });
    } catch (error) {
      if (!(error instanceof Error && error.name === "TimeoutError")) throw error;
      console.warn("[PDF] Some resources did not load in time, continuing");
    }
    await waitForAssets(page, 5000);

    // Get margin preset or custom margins
    const margins = getMargins(options);

    // Configure PDF options
    const pdfOptions: PuppeteerPDFOptions = {
      format: options.pageSize,
      landscape: options.orientation === "landscape",
      scale: options.scale ?? 1,
      margin: margins,
      printBackground: options.printBackground ?? true,
      preferCSSPageSize: false,
      // Tagged PDF improves accessibility and text extraction; the outline
      // turns headings into PDF bookmarks (requires a tagged PDF)
      tagged: true,
      outline: options.bookmarks ?? true,
    };

    // Add page numbers, header, footer and/or date if requested
    const headerFont = withFallbackFonts(fontFamilyPresets.system, lang).replace(/"/g, "'");
    const templates = buildHeaderFooter(options, headerFont);
    if (templates) {
      pdfOptions.displayHeaderFooter = true;
      pdfOptions.headerTemplate = templates.headerTemplate;
      pdfOptions.footerTemplate = templates.footerTemplate;
    }

    const pdfBuffer = await page.pdf(pdfOptions);

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error("PDF generation error:", error);
    throw error;
  } finally {
    // Always close the tab, even on failure, so pages don't pile up
    await page.close().catch(() => {});
  }
}

/**
 * Generate PDF with timeout protection
 */
export async function generatePDFWithTimeout(
  content: string,
  options: PDFOptions,
  mode: "markdown" | "html" = "markdown",
  timeoutMs: number = 60000,
  documentTitle?: string
): Promise<Buffer> {
  let timer: NodeJS.Timeout | undefined;
  return Promise.race([
    generatePDF(content, options, mode, documentTitle),
    new Promise<Buffer>((_, reject) => {
      timer = setTimeout(() => reject(new Error("PDF generation timed out")), timeoutMs);
    }),
  ]).finally(() => clearTimeout(timer));
}

// Cleanup on process exit
if (typeof process !== "undefined") {
  process.on("exit", () => {
    closeBrowser();
  });

  process.on("SIGINT", async () => {
    await closeBrowser();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await closeBrowser();
    process.exit(0);
  });
}

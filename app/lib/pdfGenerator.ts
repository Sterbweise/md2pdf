import puppeteer, {
  type Browser,
  type PDFOptions as PuppeteerPDFOptions,
} from "puppeteer";
import fs from "fs";
import hljs from "highlight.js";
import {
  markdownToHtml,
  wrapHtmlDocument,
  extractTitle,
  sanitizeMarkdown,
} from "./markdownParser";
import {
  generatePDFStylesWithOptions,
  getMargins,
  type PDFOptions,
} from "./pdfStyles";

/**
 * Server-side syntax highlighting for HTML code blocks.
 * Finds <code class="language-*"> elements and applies highlight.js classes
 * so the PDF CSS can color them correctly.
 */
function highlightHtmlCodeBlocks(html: string): string {
  // First pass: highlight <code class="language-XXX"> blocks
  let result = html.replace(
    /<code\s+class="language-(\w+)"([^>]*)>([\s\S]*?)<\/code>/gi,
    (match, lang: string, attrs: string, code: string) => {
      try {
        const decoded = decodeHtmlEntities(code);
        const highlighted = hljs.getLanguage(lang)
          ? hljs.highlight(decoded, { language: lang, ignoreIllegals: true })
          : hljs.highlightAuto(decoded);
        return `<code class="hljs language-${lang}"${attrs}>${highlighted.value}</code>`;
      } catch {
        return match;
      }
    }
  );

  // Second pass: auto-detect plain <pre><code> blocks without language class
  result = result.replace(
    /<pre([^>]*)><code(?![^>]*class="hljs)([^>]*)>([\s\S]*?)<\/code><\/pre>/gi,
    (match, preAttrs: string, codeAttrs: string, code: string) => {
      try {
        const decoded = decodeHtmlEntities(code);
        if (decoded.trim().length < 10) return match;
        const highlighted = hljs.highlightAuto(decoded);
        return `<pre${preAttrs}><code class="hljs"${codeAttrs}>${highlighted.value}</code></pre>`;
      } catch {
        return match;
      }
    }
  );

  return result;
}

/**
 * Strip inline style attributes from HTML that cause oversized PDF output.
 * Removes font-size, padding, margin, width, min-width, max-width from inline styles
 * so our PDF stylesheet takes control of sizing.
 * Also strips @page CSS rules from embedded <style> blocks to prevent margin conflicts.
 */
function normalizeHtmlForPdf(html: string): string {
  // First: strip @page rules from <style> blocks so they don't override our margins
  let result = html.replace(/<style([^>]*)>([\s\S]*?)<\/style>/gi, (match, attrs: string, cssContent: string) => {
    // Remove @page rules entirely
    const cleaned = cssContent.replace(/@page\s*\{[^}]*\}/gi, "");
    return `<style${attrs}>${cleaned}</style>`;
  });

  // Second: remove specific CSS properties from inline style attributes
  result = result.replace(/\sstyle="([^"]*)"/gi, (match, styleContent: string) => {
    // Remove size/spacing properties but keep others (like color, display, etc.)
    const cleaned = styleContent
      .replace(/font-size\s*:[^;]+;?/gi, "")
      .replace(/padding(-top|-right|-bottom|-left)?\s*:[^;]+;?/gi, "")
      .replace(/margin(-top|-right|-bottom|-left)?\s*:[^;]+;?/gi, "")
      .replace(/width\s*:[^;]+;?/gi, "")
      .replace(/min-width\s*:[^;]+;?/gi, "")
      .replace(/max-width\s*:[^;]+;?/gi, "")
      .replace(/min-height\s*:[^;]+;?/gi, "")
      .replace(/line-height\s*:[^;]+;?/gi, "")
      .trim();

    // If nothing left, remove the style attribute entirely
    if (!cleaned || cleaned === ";") return "";
    return ` style="${cleaned}"`;
  });

  return result;
}

/** Decode common HTML entities for highlight.js processing */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}

// Singleton browser instance for better performance
let browserInstance: Browser | null = null;

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
function findChromePath(): string | undefined {
  const isWindows = process.platform === "win32";

  if (isWindows) {
    const possiblePaths = [
      // Puppeteer's downloaded Chrome (priority)
      "C:\\Users\\Killian\\.cache\\puppeteer\\chrome\\win64-144.0.7559.96\\chrome-win64\\chrome.exe",
      process.env["USERPROFILE"] +
        "\\.cache\\puppeteer\\chrome\\win64-144.0.7559.96\\chrome-win64\\chrome.exe",
      // System Chrome locations
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      process.env["LOCALAPPDATA"] + "\\Google\\Chrome\\Application\\chrome.exe",
      process.env["USERPROFILE"] +
        "\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe",
      // Edge as fallback (Chromium-based)
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
      process.env["PROGRAMFILES"] +
        "\\Microsoft\\Edge\\Application\\msedge.exe",
      process.env["PROGRAMFILES(X86)"] +
        "\\Microsoft\\Edge\\Application\\msedge.exe",
    ];

    console.log("Searching for Chrome/Edge in the following locations:");
    for (const chromePath of possiblePaths) {
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
    console.log("  ✗ No system Chrome or Edge found");
  }

  return undefined;
}

async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.connected) {
    const executablePath = findChromePath();

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
        browserInstance = await puppeteer.launch({
          ...launchOptions,
          executablePath,
        });
      } else {
        console.log("No system Chrome found, using default Puppeteer browser");
        browserInstance = await puppeteer.launch(launchOptions);
      }
    } catch (error) {
      console.error("Failed to launch browser:", error);

      // Final fallback: try with minimal args
      console.log("Retrying with minimal configuration...");
      browserInstance = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    }
  }
  return browserInstance;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
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

  try {
    // Create a new page
    const page = await browser.newPage();

    let fullHtml: string;
    let title: string;

    if (mode === "html") {
      // For HTML mode, use content directly with styles
      const styles = generatePDFStylesWithOptions(options);

      // Strip inline sizing styles so our PDF stylesheet controls the layout
      const normalizedContent = normalizeHtmlForPdf(content);

      // Apply syntax highlighting to code blocks before rendering
      const highlightedContent = highlightHtmlCodeBlocks(normalizedContent);

      // Use documentTitle (filename) if provided, else extract from HTML
      const titleMatch = highlightedContent.match(/<title[^>]*>(.*?)<\/title>/i);
      title = documentTitle || (titleMatch ? titleMatch[1] : "Document");

      // Check if content is a full HTML document
      if (
        highlightedContent.trim().toLowerCase().startsWith("<!doctype") ||
        highlightedContent.trim().toLowerCase().startsWith("<html")
      ) {
        // Inject styles and optionally override <title>
        let docHtml = highlightedContent.replace(
          /<\/head>/i,
          `<style>${styles}</style></head>`
        );
        if (documentTitle) {
          docHtml = docHtml.replace(
            /<title[^>]*>[\s\S]*?<\/title>/i,
            `<title>${escapeHtml(documentTitle)}</title>`
          );
        }
        fullHtml = docHtml;
      } else {
        // Wrap partial HTML in complete document
        fullHtml = wrapHtmlDocument(highlightedContent, styles, title);
      }
    } else {
      // For Markdown mode, convert to HTML first
      const sanitizedMarkdown = sanitizeMarkdown(content);
      const htmlContent = await markdownToHtml(sanitizedMarkdown);
      // Use documentTitle (filename) if provided, else first H1
      title = documentTitle || extractTitle(content);

      // Generate styles with font size adjustments
      const styles = generatePDFStylesWithOptions(options);

      // Wrap in complete HTML document
      fullHtml = wrapHtmlDocument(htmlContent, styles, title);
    }

    // Set the page content with a more lenient wait strategy
    await page.setContent(fullHtml, {
      waitUntil: "domcontentloaded", // Changed from networkidle0 to avoid timeout
      timeout: 60000, // Increased timeout to 60 seconds
    });

    // Wait for any fonts to load (with timeout protection)
    try {
      await Promise.race([
        page.evaluateHandle("document.fonts.ready"),
        new Promise((resolve) => setTimeout(resolve, 5000)), // Max 5 seconds for fonts
      ]);
    } catch {
      console.log("Font loading skipped or timed out");
    }

    // Give a small delay for any remaining resources
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Get margin preset or custom margins
    const margins = getMargins(options);
    console.log(`[PDF] Margins: ${options.margins} → top=${margins.top}, right=${margins.right}, bottom=${margins.bottom}, left=${margins.left}`);

    // Configure PDF options
    const pdfOptions: PuppeteerPDFOptions = {
      format: options.pageSize,
      margin: margins,
      printBackground: true,
      preferCSSPageSize: false,
    };

    // Add page numbers and/or footer if requested
    if (options.showPageNumbers || options.footerText) {
      pdfOptions.displayHeaderFooter = true;
      pdfOptions.headerTemplate = "<span></span>";
      
      let footerContent = "";
      
      if (options.footerText && options.showPageNumbers) {
        // Both footer text and page numbers
        footerContent = `
          <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #666; padding: 10px 30px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <span style="flex: 1; text-align: left;">${escapeHtml(options.footerText)}</span>
            <span style="flex: 1; text-align: center;"><span class="pageNumber"></span> / <span class="totalPages"></span></span>
            <span style="flex: 1;"></span>
          </div>
        `;
      } else if (options.footerText) {
        // Only footer text
        footerContent = `
          <div style="width: 100%; text-align: center; font-size: 10px; color: #666; padding: 10px 30px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <span>${escapeHtml(options.footerText)}</span>
          </div>
        `;
      } else {
        // Only page numbers
        footerContent = `
          <div style="width: 100%; text-align: center; font-size: 10px; color: #666; padding: 10px 0;">
            <span class="pageNumber"></span> / <span class="totalPages"></span>
          </div>
        `;
      }
      
      pdfOptions.footerTemplate = footerContent;
    }

    // Generate PDF
    const pdfBuffer = await page.pdf(pdfOptions);

    // Close the page
    await page.close();

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error("PDF generation error:", error);
    throw error;
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
  return Promise.race([
    generatePDF(content, options, mode, documentTitle),
    new Promise<Buffer>((_, reject) =>
      setTimeout(() => reject(new Error("PDF generation timed out")), timeoutMs)
    ),
  ]);
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

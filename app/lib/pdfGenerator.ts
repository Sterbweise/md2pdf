import puppeteer, {
  type Browser,
  type PDFOptions as PuppeteerPDFOptions,
} from "puppeteer";
import fs from "fs";
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
        } catch (e) {
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
 */
export async function generatePDF(
  content: string,
  options: PDFOptions,
  mode: "markdown" | "html" = "markdown"
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

      // Extract title from HTML if present
      const titleMatch = content.match(/<title[^>]*>(.*?)<\/title>/i);
      title = titleMatch ? titleMatch[1] : "Document";

      // Check if content is a full HTML document
      if (
        content.trim().toLowerCase().startsWith("<!doctype") ||
        content.trim().toLowerCase().startsWith("<html")
      ) {
        // Inject styles into existing document
        fullHtml = content.replace(
          /<\/head>/i,
          `<style>${styles}</style></head>`
        );
      } else {
        // Wrap partial HTML in complete document
        fullHtml = wrapHtmlDocument(content, styles, title);
      }
    } else {
      // For Markdown mode, convert to HTML first
      const sanitizedMarkdown = sanitizeMarkdown(content);
      const htmlContent = await markdownToHtml(sanitizedMarkdown);
      title = extractTitle(content);

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
    } catch (e) {
      console.log("Font loading skipped or timed out");
    }

    // Give a small delay for any remaining resources
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Get margin preset or custom margins
    const margins = getMargins(options);

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
  timeoutMs: number = 60000
): Promise<Buffer> {
  return Promise.race([
    generatePDF(content, options, mode),
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

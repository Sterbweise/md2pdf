import { NextRequest, NextResponse } from "next/server";
import { generatePDFWithTimeout } from "@/app/lib/pdfGenerator";
import { extractTitle } from "@/app/lib/markdownParser";
import {
  defaultPDFOptions,
  fontFamilyPresets,
  codeFontFamilyPresets,
  marginPresets,
  pageSizeLabels,
  type PDFOptions,
} from "@/app/lib/pdfStyles";

export const runtime = "nodejs";
export const maxDuration = 60; // Maximum function duration in seconds

interface ConvertRequest {
  markdown?: string;
  html?: string;
  mode?: "markdown" | "html";
  options?: Partial<PDFOptions>;
  filename?: string;
  documentTitle?: string;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function clampNumber(value: unknown, min: number, max: number): number | undefined {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : undefined;
}

function optionalText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.slice(0, 200) : undefined;
}

/** Validate client options: unknown values fall back to defaults, numbers are clamped */
function parseOptions(raw: Partial<PDFOptions> = {}): PDFOptions {
  const d = defaultPDFOptions;
  const margins = oneOf(raw.margins, [...Object.keys(marginPresets), "custom"] as PDFOptions["margins"][], d.margins);
  const fontSize = oneOf(raw.fontSize, ["small", "medium", "large", "custom"] as const, d.fontSize);
  const lineHeight = oneOf(raw.lineHeight, ["compact", "normal", "relaxed", "custom"] as const, d.lineHeight);
  const cm = raw.customMargins;

  return {
    pageSize: oneOf(raw.pageSize, Object.keys(pageSizeLabels) as PDFOptions["pageSize"][], d.pageSize),
    orientation: oneOf(raw.orientation, ["portrait", "landscape"] as const, "portrait"),
    margins,
    customMargins:
      margins === "custom" && cm
        ? {
            top: clampNumber(cm.top, 0, 3) ?? 0.75,
            right: clampNumber(cm.right, 0, 3) ?? 0.75,
            bottom: clampNumber(cm.bottom, 0, 3) ?? 0.75,
            left: clampNumber(cm.left, 0, 3) ?? 0.75,
          }
        : undefined,
    scale: clampNumber(raw.scale, 0.5, 1.5) ?? 1,
    fontSize,
    customFontSize: fontSize === "custom" ? clampNumber(raw.customFontSize, 6, 24) : undefined,
    fontFamily: oneOf(raw.fontFamily, Object.keys(fontFamilyPresets) as PDFOptions["fontFamily"][], d.fontFamily),
    codeFontFamily: oneOf(raw.codeFontFamily, Object.keys(codeFontFamilyPresets) as PDFOptions["codeFontFamily"][], d.codeFontFamily),
    lineHeight,
    customLineHeight: lineHeight === "custom" ? clampNumber(raw.customLineHeight, 1, 3) : undefined,
    showPageNumbers: raw.showPageNumbers === true,
    pageNumberFormat: oneOf(raw.pageNumberFormat, ["number", "fraction", "full"] as const, "fraction"),
    showDate: raw.showDate === true,
    justifyText: raw.justifyText === true,
    headerText: optionalText(raw.headerText),
    footerText: optionalText(raw.footerText),
    codeTheme: oneOf(raw.codeTheme, ["dark", "light"] as const, "dark"),
    tableOfContents: raw.tableOfContents === true,
    pageBreakBeforeH1: raw.pageBreakBeforeH1 === true,
    showLinkUrls: raw.showLinkUrls === true,
    printBackground: raw.printBackground !== false,
    bookmarks: raw.bookmarks !== false,
  };
}

/** Strip path separators, quotes and control characters from a client-supplied filename */
function sanitizeFilename(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f"\\/<>:|?*]/g, "")
    .trim()
    .substring(0, 120);
}

/**
 * Build a Content-Disposition header that survives non-ASCII names.
 * HTTP headers only allow Latin-1, so a Chinese filename used directly
 * throws; RFC 5987 `filename*` carries the UTF-8 name, `filename` an ASCII fallback.
 */
function contentDisposition(filename: string): string {
  const asciiFallback = filename.replace(/[^\x20-\x7e]/g, "_");
  const encoded = encodeURIComponent(filename).replace(
    /['()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ConvertRequest = await request.json();

    const mode = body.mode === "html" ? "html" : "markdown";
    const content = mode === "html" ? body.html : body.markdown;

    // Validate content
    if (!content || typeof content !== "string") {
      return NextResponse.json(
        {
          error: `${mode === "html" ? "HTML" : "Markdown"} content is required`,
        },
        { status: 400 }
      );
    }

    if (content.length > 1000000) {
      return NextResponse.json(
        { error: "Content exceeds maximum size (1MB)" },
        { status: 400 }
      );
    }

    const options = parseOptions(body.options);

    // Generate PDF (documentTitle overrides content-derived title for <title> tag)
    const documentTitle =
      typeof body.documentTitle === "string" ? body.documentTitle.trim().slice(0, 200) : undefined;
    const pdfBuffer = await generatePDFWithTimeout(
      content,
      options,
      mode,
      60000,
      documentTitle
    );

    // Generate filename: prefer documentTitle, else extract from content
    const title =
      documentTitle ||
      (mode === "html"
        ? content.match(/<title[^>]*>(.*?)<\/title>/i)?.[1]
        : extractTitle(content)) ||
      "document";
    // Keep letters/digits of any script (e.g. Chinese), drop everything else
    const safeTitle = title
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .trim()
      .replace(/\s+/g, "-")
      .substring(0, 50);
    const filename = sanitizeFilename(body.filename) || `${safeTitle || "document"}.pdf`;

    // Return PDF as response
    const pdfBody = new Uint8Array(pdfBuffer);
    return new NextResponse(pdfBody, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": contentDisposition(filename),
        "Content-Length": pdfBuffer.length.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("PDF conversion error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Handle timeout errors specifically
    if (errorMessage.includes("timed out")) {
      return NextResponse.json(
        { error: "PDF generation timed out. Try with a smaller document." },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: `Failed to generate PDF: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

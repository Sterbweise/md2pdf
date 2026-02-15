import { NextRequest, NextResponse } from "next/server";
import { generatePDFWithTimeout } from "@/app/lib/pdfGenerator";
import { extractTitle } from "@/app/lib/markdownParser";
import type {
  PDFOptions,
  PageSize,
  MarginSize,
  FontSize,
  FontFamily,
  CodeFontFamily,
  LineHeight,
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

function validatePageSize(value: unknown): value is PageSize {
  return value === "A4" || value === "Letter" || value === "Legal";
}

function validateMarginSize(value: unknown): value is MarginSize {
  return value === "narrow" || value === "normal" || value === "wide" || value === "custom";
}

function validateFontSize(value: unknown): value is FontSize {
  return value === "small" || value === "medium" || value === "large" || value === "custom";
}

function validateFontFamily(value: unknown): value is FontFamily {
  const validFonts = [
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
  return typeof value === "string" && validFonts.includes(value);
}

function validateCodeFontFamily(value: unknown): value is CodeFontFamily {
  const validCodeFonts = [
    "jetbrains",
    "firacode",
    "sourcecodepro",
    "consolas",
    "monaco",
    "menlo",
  ];
  return typeof value === "string" && validCodeFonts.includes(value);
}

function validateLineHeight(value: unknown): value is LineHeight {
  return value === "compact" || value === "normal" || value === "relaxed" || value === "custom";
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ConvertRequest = await request.json();

    const mode = body.mode || "markdown";
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

    // Build PDF options with defaults
    const options: PDFOptions = {
      pageSize: validatePageSize(body.options?.pageSize)
        ? body.options.pageSize
        : "A4",
      margins: validateMarginSize(body.options?.margins)
        ? body.options.margins
        : "normal",
      customMargins: body.options?.customMargins,
      fontSize: validateFontSize(body.options?.fontSize)
        ? body.options.fontSize
        : "medium",
      customFontSize: body.options?.customFontSize,
      fontFamily: validateFontFamily(body.options?.fontFamily)
        ? body.options.fontFamily
        : "inter",
      codeFontFamily: validateCodeFontFamily(body.options?.codeFontFamily)
        ? body.options.codeFontFamily
        : "jetbrains",
      lineHeight: validateLineHeight(body.options?.lineHeight)
        ? body.options.lineHeight
        : "normal",
      customLineHeight: body.options?.customLineHeight,
      showPageNumbers: body.options?.showPageNumbers ?? false,
      footerText: body.options?.footerText,
    };

    // Generate PDF (documentTitle overrides content-derived title for <title> tag)
    const documentTitle = body.documentTitle?.trim();
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
    const safeTitle = title
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 50);
    const filename = body.filename || `${safeTitle || "document"}.pdf`;

    // Return PDF as response
    const pdfBody = new Uint8Array(pdfBuffer);
    return new NextResponse(pdfBody, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
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

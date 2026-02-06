import { NextRequest, NextResponse } from "next/server";
import { fetchNotionPage, extractPageId } from "@/app/lib/notionConverter";

export const runtime = "nodejs";
export const maxDuration = 30;

interface ImportRequest {
  pageUrl: string;
  apiKey: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ImportRequest = await request.json();

    // Validate inputs
    if (!body.pageUrl || typeof body.pageUrl !== "string") {
      return NextResponse.json(
        { error: "Notion page URL is required" },
        { status: 400 }
      );
    }

    if (!body.apiKey || typeof body.apiKey !== "string") {
      return NextResponse.json(
        { error: "Notion API key is required" },
        { status: 400 }
      );
    }

    // Validate API key format
    if (!body.apiKey.startsWith("secret_") && !body.apiKey.startsWith("ntn_")) {
      return NextResponse.json(
        {
          error:
            "Invalid Notion API key format. Key should start with 'secret_' or 'ntn_'",
        },
        { status: 400 }
      );
    }

    // Validate page URL/ID format
    try {
      extractPageId(body.pageUrl);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid page URL" },
        { status: 400 }
      );
    }

    // Fetch and convert Notion page
    const { markdown, title } = await fetchNotionPage(
      body.pageUrl,
      body.apiKey
    );

    return NextResponse.json({
      success: true,
      markdown,
      title,
    });
  } catch (error) {
    console.error("Notion import error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Handle specific Notion API errors
    if (errorMessage.includes("unauthorized") || errorMessage.includes("401")) {
      return NextResponse.json(
        {
          error:
            "Invalid API key or the integration doesn't have access to this page. Make sure you've shared the page with your integration.",
        },
        { status: 401 }
      );
    }

    if (errorMessage.includes("not_found") || errorMessage.includes("404")) {
      return NextResponse.json(
        {
          error:
            "Page not found. Make sure the page exists and you've shared it with your integration.",
        },
        { status: 404 }
      );
    }

    if (errorMessage.includes("rate_limited") || errorMessage.includes("429")) {
      return NextResponse.json(
        {
          error:
            "Rate limited by Notion API. Please wait a moment and try again.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: `Failed to import Notion page: ${errorMessage}` },
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

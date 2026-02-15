import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "MD2PDF – Free Markdown to PDF Converter Online | Notion & HTML to PDF";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #171717 0%, #262626 50%, #171717 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "60px",
        }}
      >
        {/* Logo icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "80px",
            height: "80px",
            backgroundColor: "#ffffff",
            marginBottom: "32px",
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#171717"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "64px",
            fontWeight: 800,
            color: "#ffffff",
            marginBottom: "16px",
            letterSpacing: "-2px",
          }}
        >
          MD2PDF
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "28px",
            fontWeight: 400,
            color: "#a3a3a3",
            marginBottom: "40px",
            textAlign: "center",
            maxWidth: "800px",
            lineHeight: 1.4,
          }}
        >
          Free Markdown to PDF Converter Online
        </div>

        {/* Feature tags */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {[
            "Markdown to PDF",
            "HTML to PDF",
            "Notion to PDF",
            "Open Source",
            "Free & Unlimited",
          ].map((tag) => (
            <div
              key={tag}
              style={{
                padding: "8px 20px",
                border: "1px solid #404040",
                color: "#d4d4d4",
                fontSize: "18px",
                fontWeight: 500,
              }}
            >
              {tag}
            </div>
          ))}
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            fontSize: "20px",
            color: "#737373",
            fontWeight: 500,
          }}
        >
          md2pdf.my
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}

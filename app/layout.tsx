import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";

const SITE_URL = "https://md2pdf.my";
const SITE_NAME = "MD2PDF";
const SITE_TITLE = "MD2PDF – Free Markdown to PDF Converter Online | Notion & HTML to PDF";
const SITE_DESCRIPTION =
  "Convert Markdown to PDF, HTML to PDF, and Notion exports to PDF online for free. Open source, unlimited conversions, GitHub Flavored Markdown, syntax highlighting, custom fonts & margins. No sign-up required.";

export const metadata: Metadata = {
  // ── Core Meta ──────────────────────────────────────────────
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    // Primary keywords
    "markdown to pdf",
    "md to pdf",
    "convert markdown to pdf",
    "markdown to pdf converter",
    "markdown to pdf online",
    // Notion keywords
    "notion to pdf",
    "notion export to pdf",
    "notion to pdf converter",
    "notion page to pdf",
    "convert notion to pdf",
    // HTML keywords
    "html to pdf",
    "html to pdf converter",
    "convert html to pdf",
    "html to pdf online",
    // Free / open-source keywords
    "free markdown to pdf",
    "free pdf converter",
    "open source pdf converter",
    "markdown to pdf free online",
    "unlimited pdf converter",
    "free notion to pdf",
    // Long-tail keywords
    "convert markdown to pdf online free",
    "github flavored markdown to pdf",
    "markdown to pdf with syntax highlighting",
    "best free markdown to pdf converter",
    "md to pdf converter online free",
    "convert md to pdf",
    "markdown pdf export",
    "notion export pdf converter free",
    "markdown to pdf no sign up",
    "markdown to pdf unlimited",
    // Feature keywords
    "markdown pdf custom fonts",
    "markdown pdf dark mode",
    "drag and drop markdown to pdf",
    "live preview markdown to pdf",
    "markdown table to pdf",
    "code syntax highlighting pdf",
  ],
  authors: [{ name: "Sterbweise", url: "https://kchndz.dev" }],
  creator: "Sterbweise",
  publisher: SITE_NAME,
  applicationName: SITE_NAME,

  // ── Canonical & Alternates ─────────────────────────────────
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },

  // ── Robots ─────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── Open Graph ─────────────────────────────────────────────
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MD2PDF – Free Markdown to PDF Converter Online",
        type: "image/png",
      },
    ],
  },

  // ── Twitter Card ───────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
    creator: "@sterbweise",
  },

  // ── Icons & Manifest ──────────────────────────────────────
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",

  // ── Verification (add your IDs when ready) ─────────────────
  // verification: {
  //   google: "your-google-site-verification-code",
  //   yandex: "your-yandex-verification-code",
  // },

  // ── Category ───────────────────────────────────────────────
  category: "technology",

  // ── Additional meta ────────────────────────────────────────
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": SITE_NAME,
    "msapplication-TileColor": "#171717",
    "msapplication-config": "/browserconfig.xml",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// JSON-LD Structured Data
function JsonLd() {
  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    alternateName: ["MD to PDF", "Markdown to PDF Converter", "MD2PDF Converter"],
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires a modern web browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Markdown to PDF conversion",
      "HTML to PDF conversion",
      "Notion export to PDF",
      "GitHub Flavored Markdown support",
      "Syntax highlighting",
      "Custom fonts and margins",
      "Live preview",
      "Dark mode",
      "Drag and drop file import",
      "No sign-up required",
      "Unlimited conversions",
      "Open source",
    ],
    screenshot: `${SITE_URL}/og-image.png`,
    softwareVersion: "1.0",
    author: {
      "@type": "Person",
      name: "Sterbweise",
      url: "https://kchndz.dev",
    },
    aggregateRating: undefined, // Add when you have ratings
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "MD2PDF",
    alternateName: "Markdown to PDF Converter",
    url: SITE_URL,
    description:
      "Free online tool to convert Markdown, HTML, and Notion exports to beautifully formatted PDF documents.",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    downloadUrl: "https://github.com/Sterbweise/md2pdf",
    softwareHelp: {
      "@type": "CreativeWork",
      url: "https://github.com/Sterbweise/md2pdf#readme",
    },
    isAccessibleForFree: true,
    license: "https://opensource.org/licenses/MIT",
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How do I convert Markdown to PDF for free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Simply paste or type your Markdown content into MD2PDF's editor, preview it in real-time, customize formatting options like fonts and margins, and click 'Export PDF'. No sign-up required, completely free, and unlimited conversions.",
        },
      },
      {
        "@type": "Question",
        name: "Can I convert Notion pages to PDF?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! MD2PDF supports direct Notion imports. You can upload Notion HTML exports (including ZIP files with nested archives) and convert them to beautifully formatted PDFs with preserved formatting.",
        },
      },
      {
        "@type": "Question",
        name: "Does MD2PDF support HTML to PDF conversion?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Absolutely. MD2PDF has a dual-mode editor that supports both Markdown and HTML. Switch to HTML mode, paste your HTML content, and export it as a PDF with full styling support.",
        },
      },
      {
        "@type": "Question",
        name: "Is MD2PDF free and open source?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, MD2PDF is 100% free with no limits on conversions. It's open source under the MIT License and available on GitHub. No account, sign-up, or payment is needed.",
        },
      },
      {
        "@type": "Question",
        name: "What Markdown features are supported?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "MD2PDF supports GitHub Flavored Markdown (GFM) including tables, task lists, syntax-highlighted code blocks, blockquotes, images, links, bold, italic, strikethrough, and more.",
        },
      },
      {
        "@type": "Question",
        name: "Can I customize the PDF output?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. MD2PDF offers extensive customization: 11+ fonts, adjustable margins, multiple page sizes (A4, Letter, etc.), custom line height, font size options, page numbers, and footer text.",
        },
      },
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: "Markdown to PDF",
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}`,
      },
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}

const themeInitScript = `(function(){var t=localStorage.getItem('md2pdf-theme');var d=window.matchMedia('(prefers-color-scheme:dark)').matches;var dark=t==='dark'||(t!=='light'&&d);var r=document.documentElement;r.classList.toggle('dark',dark);r.setAttribute('data-theme',dark?'dark':'light');})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <JsonLd />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

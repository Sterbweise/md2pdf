/**
 * Print-optimized CSS styles for PDF generation
 * Smart page break handling to minimize white space while maintaining readability
 */

export const pdfStyles = `
/* Base Reset and Typography */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-size: 11pt;
  line-height: 1.5;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: #1a1a1a;
  background: white;
  padding: 0;
  margin: 0;
  font-size: 11pt !important;
  line-height: 1.5 !important;
}

/* Override inline styles from source HTML (Notion exports, etc.) */
.document-content span,
.document-content div:not(.document-content),
.document-content a,
.document-content em,
.document-content strong,
.document-content b,
.document-content i {
  font-size: inherit !important;
  line-height: inherit !important;
}

.document-content * {
  max-width: 100%;
}

/* ===========================================
   SMART PAGE BREAK HANDLING
   =========================================== */

/* Headings - avoid break after, but allow content to flow */
h1, h2, h3, h4, h5, h6 {
  page-break-after: avoid;
  page-break-inside: avoid;
  break-after: avoid;
  break-inside: avoid;
}

/* Keep heading with at least 3 lines of following content */
h1 + *, h2 + *, h3 + *, h4 + *, h5 + *, h6 + * {
  page-break-before: avoid;
  break-before: avoid;
}

/* Paragraphs - allow natural flow */
p {
  orphans: 3;
  widows: 3;
}

/* Tables - ALLOW breaking across pages for large tables */
table {
  page-break-inside: auto !important;
  break-inside: auto !important;
}

/* Repeat table headers on each page */
thead {
  display: table-header-group;
}

/* Table rows can break but try to keep together when small */
tr {
  page-break-inside: avoid;
  break-inside: avoid;
}

/* For very long tables, allow row breaks */
table.allow-break tr {
  page-break-inside: auto;
  break-inside: auto;
}

/* Code blocks - allow breaking for long code */
pre {
  page-break-inside: auto !important;
  break-inside: auto !important;
}

/* Short code blocks (< 20 lines) should stay together */
pre.short-code {
  page-break-inside: avoid;
  break-inside: avoid;
}

/* Images - avoid break unless very large */
img {
  page-break-inside: avoid;
  break-inside: avoid;
  max-height: 80vh; /* Prevent single image from taking whole page */
}

/* Lists - keep first item with list start */
ul, ol {
  page-break-before: auto;
  break-before: auto;
}

li:first-child {
  page-break-before: avoid;
  break-before: avoid;
}

/* Blockquotes - try to keep together but allow break if long */
blockquote {
  page-break-inside: auto;
  break-inside: auto;
}

/* Short blockquotes should stay together */
blockquote.short {
  page-break-inside: avoid;
  break-inside: avoid;
}

/* Callouts/Asides - allow break if content is long */
aside {
  page-break-inside: auto;
  break-inside: auto;
}

/* ===========================================
   HEADINGS
   =========================================== */

h1 {
  font-size: 20pt !important;
  font-weight: 700;
  margin: 16pt 0 8pt 0;
  padding-bottom: 5pt;
  border-bottom: 2px solid #e5e7eb;
}

h2 {
  font-size: 16pt !important;
  font-weight: 600;
  margin: 14pt 0 6pt 0;
  padding-bottom: 3pt;
  border-bottom: 1px solid #e5e7eb;
}

h3 {
  font-size: 13pt !important;
  font-weight: 600;
  margin: 12pt 0 5pt 0;
}

h4 {
  font-size: 11pt !important;
  font-weight: 600;
  margin: 10pt 0 5pt 0;
}

h5, h6 {
  font-size: 10pt !important;
  font-weight: 600;
  margin: 8pt 0 4pt 0;
}

/* Reduce top margin when heading is first on a new page */
h1:first-child, h2:first-child, h3:first-child,
h4:first-child, h5:first-child, h6:first-child {
  margin-top: 0;
}

/* ===========================================
   PARAGRAPHS AND TEXT
   =========================================== */

p {
  margin: 0 0 8pt 0;
  text-align: left;
  font-size: 11pt !important;
}

/* Links */
a {
  color: #2563eb;
  text-decoration: underline;
}

/* ===========================================
   LISTS
   =========================================== */

ul, ol {
  margin: 0 0 8pt 0;
  padding-left: 20pt;
}

li {
  margin-bottom: 2pt;
  font-size: 11pt !important;
}

ul {
  list-style-type: disc;
}

ol {
  list-style-type: decimal;
}

ul ul, ol ul {
  list-style-type: circle;
  margin-bottom: 0;
}

ul ul ul, ol ol ul, ul ol ul, ol ul ul {
  list-style-type: square;
}

/* Task Lists */
ul.task-list {
  list-style-type: none;
  padding-left: 0;
}

ul.task-list li {
  display: flex;
  align-items: flex-start;
  gap: 8pt;
}

ul.task-list input[type="checkbox"] {
  margin-top: 3pt;
  width: 12pt;
  height: 12pt;
}

/* ===========================================
   BLOCKQUOTES
   =========================================== */

blockquote {
  margin: 8pt 0;
  padding: 6pt 14pt;
  border-left: 3pt solid #d1d5db;
  background: #f9fafb;
  font-style: italic;
  color: #4b5563;
}

blockquote p:last-child {
  margin-bottom: 0;
}

/* ===========================================
   HORIZONTAL RULE
   =========================================== */

hr {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 16pt 0;
}

/* ===========================================
   TABLES - Smart breaking for long tables
   =========================================== */

table {
  width: 100%;
  max-width: 100%;
  table-layout: auto;
  border-collapse: collapse;
  margin: 8pt 0;
  font-size: 9pt !important;
}

thead {
  display: table-header-group;
  background-color: #f3f4f6;
}

tbody {
  display: table-row-group;
}

th, td {
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
  white-space: normal;
  hyphens: auto;
  padding: 6pt 10pt;
  border: 1px solid #d1d5db;
  text-align: left;
  vertical-align: top;
}

/* For 3+ column tables: shrink middle column (often Type/Code) so Name/Value get more space */
table:has(td:nth-child(3)) th:nth-child(2),
table:has(td:nth-child(3)) td:nth-child(2) {
  width: 1%;
  white-space: nowrap;
}

th {
  background-color: #f3f4f6;
  font-weight: 600;
}

td {
  background-color: white;
}

tbody tr:nth-child(even) td {
  background-color: #f9fafb;
}

/* ===========================================
   CODE - Inline
   =========================================== */

code {
  font-family: 'JetBrains Mono', 'Fira Code', 'SFMono-Regular', Consolas, monospace;
  font-size: 8.5pt !important;
  background-color: #f3f4f6;
  padding: 1pt 3pt;
  border-radius: 2pt;
  color: #be185d;
}

/* ===========================================
   CODE - Block (with smart page breaks)
   =========================================== */

pre {
  font-family: 'JetBrains Mono', 'Fira Code', 'SFMono-Regular', Consolas, monospace;
  font-size: 8.5pt !important;
  background-color: #1f2937;
  color: #e5e7eb;
  padding: 8pt;
  border-radius: 4pt;
  overflow-x: hidden;
  margin: 8pt 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  /* Allow long code blocks to break across pages */
  page-break-inside: auto;
  break-inside: auto;
}

pre code {
  background: transparent;
  padding: 0;
  color: inherit;
  font-size: inherit;
  border-radius: 0;
}

/* ===========================================
   SYNTAX HIGHLIGHTING
   =========================================== */

.hljs-keyword,
.hljs-selector-tag,
.hljs-built_in {
  color: #c084fc;
}

.hljs-string,
.hljs-attr,
.hljs-addition {
  color: #86efac;
}

.hljs-number,
.hljs-literal,
.hljs-symbol {
  color: #fdba74;
}

.hljs-comment,
.hljs-quote,
.hljs-deletion {
  color: #9ca3af;
}

.hljs-function,
.hljs-title,
.hljs-class {
  color: #93c5fd;
}

.hljs-variable,
.hljs-template-variable,
.hljs-params {
  color: #67e8f9;
}

.hljs-type,
.hljs-tag {
  color: #fca5a5;
}

/* ===========================================
   IMAGES
   =========================================== */

img {
  max-width: 100%;
  height: auto;
  margin: 10pt 0;
  page-break-inside: avoid;
  break-inside: avoid;
}

/* Large images can break if needed */
img.large {
  page-break-inside: auto;
  break-inside: auto;
}

/* ===========================================
   NOTION CALLOUTS (aside elements)
   =========================================== */

aside {
  margin: 10pt 0;
  padding: 10pt 14pt;
  border-radius: 4pt;
  background: #f9fafb;
  border-left: 3pt solid #d1d5db;
  display: flex;
  flex-direction: column;
  gap: 6pt;
}

aside > :first-child {
  font-size: 18pt;
  line-height: 1;
  margin-bottom: 2pt;
}

aside p {
  margin: 3pt 0;
}

aside p:last-child {
  margin-bottom: 0;
}

aside strong {
  font-weight: 600;
  color: #1f2937;
}

/* Callout color variants */
aside[data-callout="info"],
aside.callout-info {
  background: #eff6ff;
  border-left-color: #3b82f6;
}

aside[data-callout="warning"],
aside.callout-warning {
  background: #fef3c7;
  border-left-color: #f59e0b;
}

aside[data-callout="error"],
aside.callout-error {
  background: #fee2e2;
  border-left-color: #ef4444;
}

aside[data-callout="success"],
aside.callout-success {
  background: #d1fae5;
  border-left-color: #10b981;
}

/* ===========================================
   PAGE BREAK UTILITIES
   =========================================== */

.page-break-before {
  page-break-before: always;
  break-before: page;
}

.page-break-after {
  page-break-after: always;
  break-after: page;
}

.no-page-break {
  page-break-inside: avoid;
  break-inside: avoid;
}

.allow-page-break {
  page-break-inside: auto;
  break-inside: auto;
}

/* ===========================================
   PRINT-SPECIFIC STYLES
   =========================================== */

@media print {
  body {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  
  a {
    color: #2563eb;
    text-decoration: underline;
  }
  
  a[href^="http"]:after {
    content: none;
  }
  
  /* Smart page break handling in print */
  h1, h2, h3, h4, h5, h6 {
    page-break-after: avoid;
    break-after: avoid;
  }
  
  p {
    orphans: 3;
    widows: 3;
  }
  
  /* Allow tables and code to break */
  table, pre {
    page-break-inside: auto;
    break-inside: auto;
  }
  
  /* Keep table headers repeating */
  thead {
    display: table-header-group;
  }
  
  tr {
    page-break-inside: avoid;
    break-inside: avoid;
  }
}

/* ===========================================
   COMPACT MODE - Reduces spacing for dense content
   =========================================== */

.compact h1 { margin: 16pt 0 8pt 0; }
.compact h2 { margin: 12pt 0 6pt 0; }
.compact h3 { margin: 10pt 0 5pt 0; }
.compact h4, .compact h5, .compact h6 { margin: 8pt 0 4pt 0; }
.compact p { margin: 0 0 8pt 0; }
.compact ul, .compact ol { margin: 0 0 8pt 0; }
.compact li { margin-bottom: 2pt; }
.compact table { margin: 8pt 0; }
.compact pre { margin: 8pt 0; padding: 8pt; }
.compact blockquote { margin: 8pt 0; padding: 6pt 12pt; }
.compact aside { margin: 8pt 0; padding: 8pt 12pt; }
`;

export type PageSize = "A4" | "Letter" | "Legal";
export type MarginSize = "normal" | "narrow" | "wide" | "custom";
export type FontSize = "small" | "medium" | "large" | "custom";
export type FontFamily =
  | "inter"
  | "system"
  | "georgia"
  | "times"
  | "garamond"
  | "palatino"
  | "helvetica"
  | "arial"
  | "roboto"
  | "mono"
  | "jetbrains";
export type CodeFontFamily =
  | "jetbrains"
  | "firacode"
  | "sourcecodepro"
  | "consolas"
  | "monaco"
  | "menlo";
export type LineHeight = "compact" | "normal" | "relaxed" | "custom";

export interface PDFOptions {
  pageSize: PageSize;
  margins: MarginSize;
  customMargins?: { top: number; right: number; bottom: number; left: number }; // in inches
  fontSize: FontSize;
  customFontSize?: number; // base font size in pt
  fontFamily: FontFamily;
  codeFontFamily: CodeFontFamily;
  lineHeight: LineHeight;
  customLineHeight?: number; // multiplier
  showPageNumbers: boolean;
  footerText?: string;
}

export const marginPresets: Record<
  Exclude<MarginSize, "custom">,
  { top: string; right: string; bottom: string; left: string }
> = {
  narrow: { top: "0.5in", right: "0.5in", bottom: "0.5in", left: "0.5in" },
  normal: { top: "0.75in", right: "0.75in", bottom: "0.75in", left: "0.75in" },
  wide: { top: "1in", right: "1in", bottom: "1in", left: "1in" },
};

export const fontSizeMultipliers: Record<Exclude<FontSize, "custom">, number> = {
  small: 0.9,
  medium: 1,
  large: 1.15,
};

export const fontFamilyPresets: Record<FontFamily, string> = {
  inter:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  system:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  georgia: "Georgia, 'Times New Roman', Times, serif",
  times: "'Times New Roman', Times, serif",
  garamond: "Garamond, 'EB Garamond', Georgia, serif",
  palatino: "'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif",
  helvetica: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  arial: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
  roboto: "'Roboto', 'Helvetica Neue', Arial, sans-serif",
  mono: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
  jetbrains: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
};

export const codeFontFamilyPresets: Record<CodeFontFamily, string> = {
  jetbrains: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
  firacode: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
  sourcecodepro: "'Source Code Pro', 'Fira Code', Consolas, monospace",
  consolas: "Consolas, 'Liberation Mono', Menlo, monospace",
  monaco: "Monaco, 'Lucida Console', monospace",
  menlo: "Menlo, 'Liberation Mono', Consolas, monospace",
};

export const fontFamilyLabels: Record<FontFamily, string> = {
  inter: "Inter (Default)",
  system: "System UI",
  georgia: "Georgia",
  times: "Times New Roman",
  garamond: "Garamond",
  palatino: "Palatino",
  helvetica: "Helvetica",
  arial: "Arial",
  roboto: "Roboto",
  mono: "Monospace",
  jetbrains: "JetBrains Mono",
};

export const codeFontFamilyLabels: Record<CodeFontFamily, string> = {
  jetbrains: "JetBrains Mono (Default)",
  firacode: "Fira Code",
  sourcecodepro: "Source Code Pro",
  consolas: "Consolas",
  monaco: "Monaco",
  menlo: "Menlo",
};

export const lineHeightMultipliers: Record<Exclude<LineHeight, "custom">, number> = {
  compact: 1.4,
  normal: 1.6,
  relaxed: 1.8,
};

export function generatePDFStylesWithOptions(options: PDFOptions): string {
  // Determine font size multiplier
  let multiplier: number;
  if (options.fontSize === "custom" && options.customFontSize) {
    // Custom font size: calculate multiplier based on 11pt base
    multiplier = options.customFontSize / 11;
  } else {
    multiplier = fontSizeMultipliers[options.fontSize as keyof typeof fontSizeMultipliers] || 1;
  }

  const fontFamily = fontFamilyPresets[options.fontFamily];
  const codeFontFamily = codeFontFamilyPresets[options.codeFontFamily];

  // Determine line height
  let lineHeight: number;
  if (options.lineHeight === "custom" && options.customLineHeight) {
    lineHeight = options.customLineHeight;
  } else {
    lineHeight = lineHeightMultipliers[options.lineHeight as keyof typeof lineHeightMultipliers] || 1.6;
  }

  let styles = pdfStyles;

  // Apply font size multiplier (preserve !important if present)
  styles = styles.replace(/font-size:\s*([\d.]+)pt(\s*!important)?/g, (match, size, important) => {
    const newSize = parseFloat(size) * multiplier;
    return `font-size: ${newSize.toFixed(1)}pt${important || ""}`;
  });

  // Apply body font family (exclude code blocks)
  styles = styles.replace(
    /(body\s*\{[^}]*font-family:)[^;]+;/g,
    `$1 ${fontFamily};`
  );

  // Apply code font family to code and pre elements
  styles = styles.replace(
    /(code\s*\{[^}]*font-family:)[^;]+;/g,
    `$1 ${codeFontFamily};`
  );
  styles = styles.replace(
    /(pre\s*\{[^}]*font-family:)[^;]+;/g,
    `$1 ${codeFontFamily};`
  );

  // Apply line height
  styles = styles.replace(
    /(html\s*\{[^}]*line-height:)[^;]+;/g,
    `$1 ${lineHeight};`
  );

  // Append @page rule with the correct margins
  // This ensures CSS margins match Puppeteer margins and override any source HTML @page rules
  const margins = getMargins(options);
  styles += `
@page {
  margin: ${margins.top} ${margins.right} ${margins.bottom} ${margins.left} !important;
}
`;

  return styles;
}

export function getMargins(options: PDFOptions): { top: string; right: string; bottom: string; left: string } {
  if (options.margins === "custom" && options.customMargins) {
    return {
      top: `${options.customMargins.top}in`,
      right: `${options.customMargins.right}in`,
      bottom: `${options.customMargins.bottom}in`,
      left: `${options.customMargins.left}in`,
    };
  }
  return marginPresets[options.margins as keyof typeof marginPresets] || marginPresets.normal;
}

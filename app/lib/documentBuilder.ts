/**
 * Builds the complete HTML document that gets printed to PDF.
 * Runs on the server (PDF export) and in the browser (live preview, HTML export),
 * so the preview shows exactly what the PDF will contain.
 */
import hljs from "highlight.js";
import {
  markdownToHtml,
  wrapHtmlDocument,
  extractTitle,
  sanitizeMarkdown,
  detectLanguage,
  escapeHtml,
} from "./markdownParser";
import {
  generatePDFStylesWithOptions,
  getWebFontLinks,
  type PDFOptions,
} from "./pdfStyles";

export interface BuiltDocument {
  html: string;
  title: string;
  lang: string;
}

/** Decode common HTML entities for highlight.js processing */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&amp;/g, "&");
}

/**
 * Syntax highlighting for HTML code blocks.
 * Finds <code class="language-*"> elements and applies highlight.js classes
 * so the PDF CSS can color them correctly.
 */
export function highlightHtmlCodeBlocks(html: string): string {
  // First pass: highlight <code class="language-XXX"> blocks
  let result = html.replace(
    /<code\s+class="language-([\w+#-]+)"([^>]*)>([\s\S]*?)<\/code>/gi,
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
export function normalizeHtmlForPdf(html: string): string {
  // First: strip @page rules from <style> blocks so they don't override our margins
  let result = html.replace(/<style([^>]*)>([\s\S]*?)<\/style>/gi, (match, attrs: string, cssContent: string) => {
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
      .replace(/(^|;)\s*(min-|max-)?width\s*:[^;]+;?/gi, "$1")
      .replace(/min-height\s*:[^;]+;?/gi, "")
      .replace(/line-height\s*:[^;]+;?/gi, "")
      .trim();

    // If nothing left, remove the style attribute entirely
    if (!cleaned || cleaned === ";") return "";
    return ` style="${cleaned}"`;
  });

  return result;
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/\s+/g, "-") || "section"
  );
}

/**
 * Give every h1–h3 an id (keeping existing ones) and build a table of contents
 * that links to them. Returns the updated HTML and the TOC markup ("" if no headings).
 */
function buildTableOfContents(html: string): { html: string; toc: string } {
  const entries: Array<{ level: number; id: string; text: string }> = [];
  const used = new Set<string>();

  const withIds = html.replace(
    /<h([1-3])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi,
    (match, level: string, attrs: string = "", inner: string) => {
      const text = decodeHtmlEntities(inner.replace(/<[^>]+>/g, "")).trim();
      if (!text) return match;

      const existingId = attrs.match(/\sid=["']([^"']+)["']/i)?.[1];
      let id = existingId || slugify(text);
      if (!existingId) {
        const base = id;
        for (let n = 1; used.has(id); n++) id = `${base}-${n}`;
      }
      used.add(id);
      entries.push({ level: Number(level), id, text });

      return existingId ? match : `<h${level}${attrs} id="${escapeHtml(id)}">${inner}</h${level}>`;
    }
  );

  if (entries.length < 2) return { html, toc: "" };

  const items = entries
    .map(
      (e) =>
        `<li class="toc-level-${e.level}"><a href="#${escapeHtml(e.id)}">${escapeHtml(e.text)}</a></li>`
    )
    .join("");
  return {
    html: withIds,
    toc: `<nav class="toc"><p class="toc-title">Contents</p><ol>${items}</ol></nav>`,
  };
}

/** Insert the TOC after a leading H1 (the document title) or at the very top */
function insertToc(bodyHtml: string, toc: string): string {
  const leadingH1 = bodyHtml.match(/^\s*<h1[\s>][\s\S]*?<\/h1>/i);
  if (leadingH1) {
    return leadingH1[0] + toc + bodyHtml.slice(leadingH1[0].length);
  }
  return toc + bodyHtml;
}

/**
 * Build the full, styled HTML document for the given content and options.
 * Remote resources are left as-is; the caller decides whether to embed them.
 */
export async function buildDocument(
  content: string,
  options: PDFOptions,
  mode: "markdown" | "html",
  documentTitle?: string
): Promise<BuiltDocument> {
  const lang = detectLanguage(content);
  const styles = generatePDFStylesWithOptions(options, lang);
  const fontLinks = getWebFontLinks(options);

  if (mode === "markdown") {
    let body = await markdownToHtml(sanitizeMarkdown(content));
    if (options.tableOfContents) {
      const { html, toc } = buildTableOfContents(body);
      body = toc ? insertToc(html, toc) : html;
    }
    const title = documentTitle || extractTitle(content);
    const html = wrapHtmlDocument(body, styles, title, lang).replace(
      "</head>",
      `${fontLinks}</head>`
    );
    return { html, title, lang };
  }

  // HTML mode: normalize sizing, highlight code, then inject our styles
  let body = highlightHtmlCodeBlocks(normalizeHtmlForPdf(content));
  let toc = "";
  if (options.tableOfContents) {
    ({ html: body, toc } = buildTableOfContents(body));
  }

  const titleMatch = body.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = documentTitle || titleMatch?.[1]?.trim() || "Document";
  const isFullDocument = /^\s*(<!doctype|<html)/i.test(body);

  if (!isFullDocument) {
    return {
      html: wrapHtmlDocument(toc ? insertToc(body, toc) : body, styles, title, lang).replace(
        "</head>",
        `${fontLinks}</head>`
      ),
      title,
      lang,
    };
  }

  let html = body;
  if (toc) {
    html = html.replace(/<body([^>]*)>/i, (tag) => tag + toc);
  }
  // Our styles go last in <head> so they win over the document's own CSS
  const headExtras = `${fontLinks}<style>${styles}</style>`;
  html = /<\/head>/i.test(html)
    ? html.replace(/<\/head>/i, `${headExtras}</head>`)
    : html.replace(/<html([^>]*)>/i, (tag) => `${tag}<head>${headExtras}</head>`);
  if (!/<meta[^>]+charset/i.test(html)) {
    html = html.replace(/<head([^>]*)>/i, (tag) => `${tag}<meta charset="UTF-8">`);
  }
  if (documentTitle) {
    html = /<title[^>]*>[\s\S]*?<\/title>/i.test(html)
      ? html.replace(/<title[^>]*>[\s\S]*?<\/title>/i, `<title>${escapeHtml(documentTitle)}</title>`)
      : html.replace(/<head([^>]*)>/i, (tag) => `${tag}<title>${escapeHtml(documentTitle)}</title>`);
  }
  // Documents without a lang attribute get the detected one (matters for CJK glyphs)
  if (!/<html[^>]*\slang=/i.test(html)) {
    html = html.replace(/<html/i, `<html lang="${lang}"`);
  }

  return { html, title, lang };
}

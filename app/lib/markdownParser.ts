import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import rehypeRaw from "rehype-raw";

/**
 * Convert markdown string to HTML
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeHighlight, { detect: true, ignoreMissing: true })
    .use(rehypeStringify)
    .process(markdown);

  return String(result);
}

/**
 * Wrap HTML content in a complete HTML document with styles
 */
export function wrapHtmlDocument(
  htmlContent: string,
  styles: string,
  title: string = "Document"
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
${styles}
  </style>
</head>
<body>
  <div class="document-content">
${htmlContent}
  </div>
</body>
</html>`;
}

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

/**
 * Extract title from markdown content (first h1 heading)
 */
export function extractTitle(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "Document";
}

/**
 * Sanitize markdown content for safe processing
 */
export function sanitizeMarkdown(markdown: string): string {
  // Remove potentially dangerous HTML tags while preserving markdown
  const dangerousTags = /<script[^>]*>[\s\S]*?<\/script>/gi;
  const dangerousEvents = /\s(on\w+)=["'][^"']*["']/gi;

  return markdown.replace(dangerousTags, "").replace(dangerousEvents, "");
}

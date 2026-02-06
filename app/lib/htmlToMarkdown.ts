/**
 * Convert HTML (especially Notion HTML exports) to Markdown
 */

export function convertHtmlToMarkdown(html: string): string {
  // Remove script and style tags
  html = html.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ""
  );
  html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  // Convert headings
  html = html.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "\n# $1\n");
  html = html.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "\n## $1\n");
  html = html.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\n### $1\n");
  html = html.replace(/<h4[^>]*>(.*?)<\/h4>/gi, "\n#### $1\n");
  html = html.replace(/<h5[^>]*>(.*?)<\/h5>/gi, "\n##### $1\n");
  html = html.replace(/<h6[^>]*>(.*?)<\/h6>/gi, "\n###### $1\n");

  // Convert bold
  html = html.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**");
  html = html.replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**");

  // Convert italic
  html = html.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*");
  html = html.replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*");

  // Convert underline (Notion uses this)
  html = html.replace(/<u[^>]*>(.*?)<\/u>/gi, "*$1*");

  // Convert strikethrough
  html = html.replace(/<del[^>]*>(.*?)<\/del>/gi, "~~$1~~");
  html = html.replace(/<s[^>]*>(.*?)<\/s>/gi, "~~$1~~");
  html = html.replace(/<strike[^>]*>(.*?)<\/strike>/gi, "~~$1~~");

  // Convert code
  html = html.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`");

  // Convert pre (code blocks)
  html = html.replace(
    /<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis,
    (match, code) => {
      return "\n```\n" + decodeHtml(code.trim()) + "\n```\n";
    }
  );
  html = html.replace(/<pre[^>]*>(.*?)<\/pre>/gis, (match, code) => {
    return "\n```\n" + decodeHtml(code.trim()) + "\n```\n";
  });

  // Convert links
  html = html.replace(
    /<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi,
    "[$2]($1)"
  );

  // Convert images
  html = html.replace(
    /<img[^>]*src=["']([^"']*)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi,
    "![$2]($1)"
  );
  html = html.replace(/<img[^>]*src=["']([^"']*)["'][^>]*>/gi, "![]($1)");

  // Convert unordered lists
  html = html.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
    const items = content.match(/<li[^>]*>(.*?)<\/li>/gis) || [];
    return (
      "\n" +
      items
        .map((item: string) => {
          const text = item.replace(/<li[^>]*>(.*?)<\/li>/is, "$1").trim();
          return `- ${text}`;
        })
        .join("\n") +
      "\n"
    );
  });

  // Convert ordered lists
  html = html.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
    const items = content.match(/<li[^>]*>(.*?)<\/li>/gis) || [];
    return (
      "\n" +
      items
        .map((item: string, index: number) => {
          const text = item.replace(/<li[^>]*>(.*?)<\/li>/is, "$1").trim();
          return `${index + 1}. ${text}`;
        })
        .join("\n") +
      "\n"
    );
  });

  // Convert blockquotes
  html = html.replace(
    /<blockquote[^>]*>(.*?)<\/blockquote>/gis,
    (match, content) => {
      const lines = content.trim().split("\n");
      return (
        "\n" + lines.map((line: string) => `> ${line.trim()}`).join("\n") + "\n"
      );
    }
  );

  // Convert Notion callouts (aside or div with specific class)
  html = html.replace(/<aside[^>]*>(.*?)<\/aside>/gis, (match, content) => {
    return "\n<aside>\n" + content.trim() + "\n</aside>\n";
  });
  html = html.replace(
    /<div[^>]*class=["'][^"']*callout[^"']*["'][^>]*>(.*?)<\/div>/gis,
    (match, content) => {
      return "\n<aside>\n" + content.trim() + "\n</aside>\n";
    }
  );

  // Convert tables
  html = html.replace(/<table[^>]*>(.*?)<\/table>/gis, (match, content) => {
    const rows = content.match(/<tr[^>]*>(.*?)<\/tr>/gis) || [];

    if (rows.length === 0) return "";

    let markdown = "\n";
    let isFirstRow = true;

    rows.forEach((row: string) => {
      const cells = row.match(/<t[hd][^>]*>(.*?)<\/t[hd]>/gis) || [];
      const cellContents = cells.map((cell: string) => {
        return cell.replace(/<t[hd][^>]*>(.*?)<\/t[hd]>/is, "$1").trim();
      });

      markdown += "| " + cellContents.join(" | ") + " |\n";

      // Add separator after first row (header)
      if (isFirstRow) {
        markdown += "| " + cellContents.map(() => "---").join(" | ") + " |\n";
        isFirstRow = false;
      }
    });

    return markdown + "\n";
  });

  // Convert horizontal rules
  html = html.replace(/<hr[^>]*>/gi, "\n---\n");

  // Convert line breaks
  html = html.replace(/<br\s*\/?>/gi, "\n");

  // Convert paragraphs
  html = html.replace(/<p[^>]*>(.*?)<\/p>/gis, "\n$1\n");

  // Convert divs to line breaks (common in Notion exports)
  html = html.replace(/<div[^>]*>(.*?)<\/div>/gis, "\n$1\n");

  // Remove remaining HTML tags
  html = html.replace(/<[^>]+>/g, "");

  // Decode HTML entities
  html = decodeHtml(html);

  // Clean up multiple newlines
  html = html.replace(/\n{3,}/g, "\n\n");

  // Trim
  html = html.trim();

  return html;
}

/**
 * Decode HTML entities
 */
function decodeHtml(text: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&nbsp;": " ",
    "&mdash;": "—",
    "&ndash;": "–",
    "&hellip;": "…",
    "&copy;": "©",
    "&reg;": "®",
    "&trade;": "™",
  };

  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, "g"), char);
  }

  // Decode numeric entities
  decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(dec);
  });
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  return decoded;
}

/**
 * Extract title from HTML (first h1)
 */
export function extractTitleFromHtml(html: string): string {
  const match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (match) {
    const title = match[1].replace(/<[^>]+>/g, "").trim();
    return decodeHtml(title);
  }
  return "Document";
}

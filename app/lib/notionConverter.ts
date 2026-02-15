import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";

/**
 * Extract page ID from various Notion URL formats
 */
export function extractPageId(urlOrId: string): string {
  // If it's already a valid ID format (32 hex chars, possibly with dashes)
  const cleanId = urlOrId.replace(/-/g, "");
  if (/^[a-f0-9]{32}$/i.test(cleanId)) {
    return cleanId;
  }

  // Try to extract from URL
  const patterns = [
    // Standard page URL: notion.so/workspace/Page-Title-abc123def456...
    /([a-f0-9]{32})(?:\?|$)/i,
    // URL with page ID at the end after last dash
    /-([a-f0-9]{32})(?:\?|$)/i,
    // Database page URL
    /\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i,
    // Just the ID with dashes
    /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i,
  ];

  for (const pattern of patterns) {
    const match = urlOrId.match(pattern);
    if (match) {
      return match[1].replace(/-/g, "");
    }
  }

  throw new Error(
    "Could not extract page ID from the provided URL. Please provide a valid Notion page URL or page ID."
  );
}

/**
 * Fetch a Notion page and convert it to Markdown and/or HTML
 */
export async function fetchNotionPage(
  pageUrl: string,
  apiKey: string,
  format: "markdown" | "html" = "markdown"
): Promise<{ markdown: string; html: string; title: string }> {
  // Initialize Notion client
  const notion = new Client({
    auth: apiKey,
  });

  // Extract page ID
  const pageId = extractPageId(pageUrl);

  // Get page metadata for title
  let title = "Untitled";
  let icon = "";
  try {
    const pageInfo = await notion.pages.retrieve({ page_id: pageId });

    // Extract title from page properties
    if ("properties" in pageInfo) {
      const titleProperty =
        pageInfo.properties.title || pageInfo.properties.Name;
      if (
        titleProperty &&
        "title" in titleProperty &&
        Array.isArray(titleProperty.title)
      ) {
        title =
          titleProperty.title.map((t) => t.plain_text).join("") || "Untitled";
      }
    }

    // Extract icon if present
    if ("icon" in pageInfo && pageInfo.icon) {
      if (pageInfo.icon.type === "emoji") {
        icon = pageInfo.icon.emoji || "";
      }
    }
  } catch (error) {
    console.warn("Could not retrieve page title:", error);
  }

  // Fetch all blocks
  const blocks = await fetchAllBlocks(notion, pageId);

  // Convert to HTML if requested
  let html = "";
  if (format === "html") {
    html = await blocksToNotionHtml(blocks, title, icon);
  }

  // Convert to Markdown
  const n2m = new NotionToMarkdown({
    notionClient: notion,
    config: {
      parseChildPages: false,
      separateChildPage: true,
      convertImagesToBase64: true, // Notion file URLs expire; embed as base64
    },
  });

  // Callout/aside: use default (blockquote format with children)
  n2m.setCustomTransformer("callout", async () => false);

  // Aside: render as blockquote (compatible markdown)
  n2m.setCustomTransformer("aside", async (block) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b = block as any;
    if (b.type !== "aside" || !b.aside) return false;
    const text = (b.aside.rich_text || []).map((t: { plain_text: string }) => t.plain_text).join("");
    return `> ${text}`;
  });

  // Table: output HTML with colgroup for proper dimensions (table_width)
  n2m.setCustomTransformer("table", async (block) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b = block as any;
    if (b.type !== "table") return false;
    const tableWidth = Math.max(b.table?.table_width || 3, 1);
    const hasHeader = b.table?.has_column_header ?? true;
    const resp = await notion.blocks.children.list({ block_id: b.id, page_size: 100 });
    const rows = (resp as any).results || [];
    // table-layout: auto lets columns fit content; max-width + word-break prevent overflow
    let html = `<table style="border-collapse: collapse; width: 100%; table-layout: auto;">\n`;
    rows.forEach((row: any, i: number) => {
      if (row.type !== "table_row") return;
      const cells = row.table_row?.cells || [];
      const isHeader = i === 0 && hasHeader;
      const style = "border: 1px solid #e5e5e5; padding: 8px 12px; text-align: left; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;";
      html += "<tr>";
      cells.forEach((cell: any[], j: number) => {
        const cellTag = isHeader || (j === 0 && b.table?.has_row_header) ? "th" : "td";
        const cellHtml = richTextToNotionHtml(cell);
        html += `<${cellTag} style="${style}">${cellHtml}</${cellTag}>`;
      });
      html += "</tr>\n";
    });
    html += "</table>";
    return html;
  });

  n2m.setCustomTransformer("toggle", async (block) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((block as any).type !== "toggle") return false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toggle = (block as any).toggle;
    const text = toggle.rich_text.map((t: { plain_text: string }) => t.plain_text).join("");
    return `<details>\n<summary>${text}</summary>\n\n</details>`;
  });

  const mdBlocks = await n2m.pageToMarkdown(pageId);
  const mdString = n2m.toMarkdownString(mdBlocks);
  
  // Clean up the markdown to fix indentation and formatting issues
  let cleanedMd = mdString.parent
    // Remove excessive indentation (notion-to-md sometimes adds 4+ spaces)
    .replace(/^([ ]{4,})/gm, "  ")
    // Fix code blocks that are accidentally created (lines starting with 4+ spaces)
    .replace(/^    ([^-*\d])/gm, "$1")
    // Remove trailing whitespace
    .replace(/[ \t]+$/gm, "")
    // Normalize multiple blank lines to max 2
    .replace(/\n{4,}/g, "\n\n\n")
    // Fix lists that lost their markers
    .replace(/^(\d+)\\\./gm, "$1.")
    // Trim
    .trim();

  const markdown = `# ${icon ? icon + " " : ""}${title}\n\n${cleanedMd}`;

  return { markdown, html, title };
}

/**
 * Fetch all blocks from a Notion page recursively
 */
async function fetchAllBlocks(notion: Client, blockId: string): Promise<any[]> {
  const blocks: any[] = [];
  let cursor: string | undefined;

  do {
    const response: any = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100,
    });

    blocks.push(...response.results);
    cursor = response.next_cursor || undefined;
  } while (cursor);

  // Recursively fetch child blocks
  for (const block of blocks) {
    if (block.has_children && block.type !== "child_page" && block.type !== "child_database") {
      try {
        block.children = await fetchAllBlocks(notion, block.id);
      } catch (err) {
        console.warn(`Failed to fetch children for block ${block.id}:`, err);
        block.children = [];
      }
    }
  }

  return blocks;
}

/**
 * Convert Notion blocks to Notion-styled HTML (replicates ZIP export format)
 */
async function blocksToNotionHtml(blocks: any[], title: string, icon?: string): Promise<string> {
  const bodyParts = await Promise.all(blocks.map((block) => blockToNotionHtml(block, 0)));
  const bodyContent = bodyParts.join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      max-width: 100%;
      margin: 0;
      padding: 20px;
      color: #37352f;
    }
    .page-body { max-width: 900px; margin: 0 auto; }
    .block { margin-bottom: 2px; }
    h1, h2, h3 { font-weight: 600; margin: 16px 0 4px 0; line-height: 1.3; }
    h1 { font-size: 2em; }
    h2 { font-size: 1.5em; }
    h3 { font-size: 1.17em; }
    p { margin: 4px 0; white-space: pre-wrap; }
    ul, ol { margin: 0; padding-left: 24px; }
    li { margin: 2px 0; }
    code { 
      background: rgba(135,131,120,0.15); 
      color: #eb5757; 
      padding: 0.2em 0.4em; 
      border-radius: 3px;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 85%;
    }
    pre { 
      background: #f7f6f3; 
      border-radius: 3px; 
      padding: 16px; 
      overflow-x: auto;
      tab-size: 2;
      margin: 4px 0;
    }
    pre code { 
      background: transparent; 
      color: inherit; 
      padding: 0;
      white-space: pre;
    }
    .callout { 
      display: flex;
      padding: 16px;
      border-radius: 3px;
      margin: 4px 0;
      background: #f7f6f3;
      align-items: flex-start;
      gap: 8px;
    }
    .callout-icon { font-size: 1.3em; flex-shrink: 0; line-height: 1.4; }
    .callout-text { flex: 1; }
    .block-color-gray_background { background: #ebeced; }
    .block-color-brown_background { background: #e9e5e3; }
    .block-color-orange_background { background: #fadec9; }
    .block-color-yellow_background { background: #fdecc8; }
    .block-color-green_background { background: #dbeddb; }
    .block-color-blue_background { background: #d3e5ef; }
    .block-color-purple_background { background: #e8deee; }
    .block-color-pink_background { background: #f5e0e9; }
    .block-color-red_background { background: #ffe2dd; }
    blockquote { 
      border-left: 3px solid currentColor; 
      padding-left: 16px; 
      margin: 4px 0;
      font-size: 1em;
    }
    table { border-collapse: collapse; width: 100%; margin: 4px 0; }
    th, td { 
      border: 1px solid #e5e5e5; 
      padding: 8px 12px; 
      text-align: left;
      min-width: 80px;
    }
    th { background: #f7f6f3; font-weight: 600; }
    .simple-table-header { background: #f7f6f3; font-weight: 600; }
    img { max-width: 100%; height: auto; margin: 8px 0; }
    figure { margin: 8px 0; }
    figcaption { font-size: 0.9em; color: #787774; margin-top: 4px; text-align: center; }
    details { margin: 4px 0; }
    summary { cursor: pointer; font-weight: 500; padding: 4px 0; }
    .to-do { display: flex; align-items: flex-start; gap: 6px; margin: 2px 0; }
    .to-do input[type="checkbox"] { margin-top: 3px; }
    hr { border: none; border-top: 1px solid rgba(55,53,47,0.16); margin: 16px 0; }
    /* Notion rich text annotation colors */
    .gray { color: #9B9A97; }
    .brown { color: #64473A; }
    .orange { color: #D9730D; }
    .yellow { color: #DFAB01; }
    .green { color: #0F7B6C; }
    .blue { color: #0B6E99; }
    .purple { color: #6940A5; }
    .pink { color: #AD1A72; }
    .red { color: #E03E3E; }
    .gray-background { background: #ebeced; }
    .brown-background { background: #e9e5e3; }
    .orange-background { background: #fadec9; }
    .yellow-background { background: #fdecc8; }
    .green-background { background: #dbeddb; }
    .blue-background { background: #d3e5ef; }
    .purple-background { background: #e8deee; }
    .pink-background { background: #f5e0e9; }
    .red-background { background: #ffe2dd; }
  </style>
</head>
<body>
  <div class="page-body">
    <h1 class="block">${icon ? `<span style="margin-right: 8px;">${escapeHtml(icon)}</span>` : ""}${escapeHtml(title)}</h1>
${bodyContent}
  </div>
</body>
</html>`;
}

/**
 * Fetch image URL and return as base64 data URL (for Notion-hosted files that expire)
 */
async function fetchImageAsBase64(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MD2PDF/1.0)",
        "Accept": "image/*",
      },
      // Notion file URLs expire in 1h; fetch promptly
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return url;
    const buf = await res.arrayBuffer();
    const base64 = Buffer.from(buf).toString("base64");
    const contentType = res.headers.get("content-type") || "image/png";
    return `data:${contentType};base64,${base64}`;
  } catch {
    return url;
  }
}

/**
 * Convert a single Notion block to HTML with Notion styling
 */
async function blockToNotionHtml(block: any, indent: number = 0): Promise<string> {
  const type = block.type;
  const indentClass = indent > 0 ? ` style="margin-left: ${indent * 24}px;"` : "";

  try {
    switch (type) {
      case "paragraph": {
        const text = richTextToNotionHtml(block.paragraph.rich_text);
        const color = block.paragraph.color !== "default" ? ` block-color-${block.paragraph.color}` : "";
        return `<p class="block${color}"${indentClass}>${text || "<br>"}</p>\n`;
      }

      case "heading_1": {
        const text = richTextToNotionHtml(block.heading_1.rich_text);
        const color = block.heading_1.color !== "default" ? ` block-color-${block.heading_1.color}` : "";
        return `<h1 class="block${color}"${indentClass}>${text}</h1>\n`;
      }

      case "heading_2": {
        const text = richTextToNotionHtml(block.heading_2.rich_text);
        const color = block.heading_2.color !== "default" ? ` block-color-${block.heading_2.color}` : "";
        return `<h2 class="block${color}"${indentClass}>${text}</h2>\n`;
      }

      case "heading_3": {
        const text = richTextToNotionHtml(block.heading_3.rich_text);
        const color = block.heading_3.color !== "default" ? ` block-color-${block.heading_3.color}` : "";
        return `<h3 class="block${color}"${indentClass}>${text}</h3>\n`;
      }

      case "bulleted_list_item": {
        const text = richTextToNotionHtml(block.bulleted_list_item.rich_text);
        const color = block.bulleted_list_item.color !== "default" ? ` block-color-${block.bulleted_list_item.color}` : "";
        const children = block.children ? (await Promise.all(block.children.map((child: any) => blockToNotionHtml(child, indent + 1)))).join("") : "";
        return `<ul class="block${color}"${indentClass}><li>${text}${children ? `\n${children}` : ""}</li></ul>\n`;
      }

      case "numbered_list_item": {
        const text = richTextToNotionHtml(block.numbered_list_item.rich_text);
        const color = block.numbered_list_item.color !== "default" ? ` block-color-${block.numbered_list_item.color}` : "";
        const children = block.children ? (await Promise.all(block.children.map((child: any) => blockToNotionHtml(child, indent + 1)))).join("") : "";
        return `<ol class="block${color}"${indentClass}><li>${text}${children ? `\n${children}` : ""}</li></ol>\n`;
      }

      case "to_do": {
        const checked = block.to_do.checked ? ' checked="checked"' : "";
        const text = richTextToNotionHtml(block.to_do.rich_text);
        const color = block.to_do.color !== "default" ? ` block-color-${block.to_do.color}` : "";
        const children = block.children ? (await Promise.all(block.children.map((child: any) => blockToNotionHtml(child, indent + 1)))).join("") : "";
        return `<div class="to-do block${color}"${indentClass}><input type="checkbox"${checked} disabled><span>${text}</span>${children}</div>\n`;
      }

      case "toggle": {
        const text = richTextToNotionHtml(block.toggle.rich_text);
        const children = block.children ? (await Promise.all(block.children.map((child: any) => blockToNotionHtml(child, 0)))).join("") : "";
        return `<details class="block"${indentClass}><summary>${text}</summary>\n${children}</details>\n`;
      }

      case "code": {
        const language = block.code.language || "plain text";
        const caption = block.code.caption ? richTextToNotionHtml(block.code.caption) : "";
        const code = block.code.rich_text.map((t: any) => t.plain_text).join("");
        return `<pre class="block"${indentClass}><code class="language-${escapeHtml(language).replace(/\s+/g, "")}">${escapeHtml(code)}</code></pre>${caption ? `<p class="code-caption" style="font-size: 0.9em; color: #787774; margin-top: -4px;">${caption}</p>` : ""}\n`;
      }

      case "quote": {
        const text = richTextToNotionHtml(block.quote.rich_text);
        const color = block.quote.color !== "default" ? ` block-color-${block.quote.color}` : "";
        const children = block.children ? (await Promise.all(block.children.map((child: any) => blockToNotionHtml(child, 0)))).join("") : "";
        return `<blockquote class="block${color}"${indentClass}>${text}${children}</blockquote>\n`;
      }

      case "callout": {
        const iconEmoji = block.callout.icon?.type === "emoji" ? block.callout.icon.emoji : "💡";
        const text = richTextToNotionHtml(block.callout.rich_text);
        const color = block.callout.color !== "default" ? ` block-color-${block.callout.color}` : " block-color-gray_background";
        const children = block.children ? (await Promise.all(block.children.map((child: any) => blockToNotionHtml(child, 0)))).join("") : "";
        return `<div class="callout${color}"${indentClass}><div class="callout-icon">${escapeHtml(iconEmoji)}</div><div class="callout-text">${text}${children}</div></div>\n`;
      }

      case "divider":
        return `<hr class="block"${indentClass}>\n`;

      case "image": {
        const rawUrl = block.image.type === "external" ? block.image.external?.url : block.image.file?.url;
        const caption = block.image.caption ? richTextToNotionHtml(block.image.caption) : "";
        if (!rawUrl) return "";
        // Fetch and embed as base64 so Notion-hosted images (which expire) work in exported HTML
        const imageUrl = rawUrl.startsWith("data:") ? rawUrl : await fetchImageAsBase64(rawUrl);
        return `<figure class="block"${indentClass}><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(caption)}">${caption ? `<figcaption>${caption}</figcaption>` : ""}</figure>\n`;
      }

      case "video": {
        const videoUrl = block.video.type === "external" ? block.video.external?.url : block.video.file?.url;
        const caption = block.video.caption ? richTextToNotionHtml(block.video.caption) : "";
        if (!videoUrl) return "";
        return `<figure class="block"${indentClass}><video controls src="${escapeHtml(videoUrl)}"></video>${caption ? `<figcaption>${caption}</figcaption>` : ""}</figure>\n`;
      }

      case "file": {
        const fileUrl = block.file.type === "external" ? block.file.external?.url : block.file.file?.url;
        const caption = block.file.caption ? richTextToNotionHtml(block.file.caption) : block.file.name || "File";
        if (!fileUrl) return "";
        return `<p class="block"${indentClass}><a href="${escapeHtml(fileUrl)}" target="_blank">📎 ${escapeHtml(caption)}</a></p>\n`;
      }

      case "bookmark": {
        const url = block.bookmark.url;
        const caption = block.bookmark.caption ? richTextToNotionHtml(block.bookmark.caption) : url;
        return `<p class="block"${indentClass}><a href="${escapeHtml(url)}" target="_blank">🔖 ${escapeHtml(caption)}</a></p>\n`;
      }

      case "table": {
        const hasHeader = block.table.has_column_header;
        const hasRowHeader = block.table.has_row_header;
        const rows = block.children || [];
        
        let tableHtml = `<table class="block"${indentClass}>\n`;
        
        rows.forEach((row: any, i: number) => {
          if (row.type === "table_row") {
            const cells = row.table_row.cells || [];
            const isFirstRow = i === 0 && hasHeader;
            const tag = isFirstRow || hasRowHeader ? "th" : "td";
            const rowClass = isFirstRow ? ' class="simple-table-header"' : "";
            
            tableHtml += `<tr${rowClass}>`;
            cells.forEach((cell: any[], j: number) => {
              const cellTag = (isFirstRow || (j === 0 && hasRowHeader)) ? "th" : "td";
              tableHtml += `<${cellTag}>${richTextToNotionHtml(cell)}</${cellTag}>`;
            });
            tableHtml += `</tr>\n`;
          }
        });
        
        tableHtml += `</table>\n`;
        return tableHtml;
      }

      case "table_row":
        // Handled by parent table block
        return "";

      case "column_list": {
        const columns = block.children || [];
        const colHtml = (await Promise.all(columns.map((col: any) => blockToNotionHtml(col, indent)))).join("");
        return `<div class="block" style="display: flex; gap: 16px;"${indentClass}>${colHtml}</div>\n`;
      }

      case "column": {
        const children = block.children || [];
        const colHtml = (await Promise.all(children.map((child: any) => blockToNotionHtml(child, 0)))).join("");
        return `<div style="flex: 1; min-width: 0;">${colHtml}</div>`;
      }

      case "child_page":
      case "child_database":
        // Skip child pages/databases
        return "";

      case "aside":
        // Aside blocks (callout-style) render as blockquote
        if (block.aside?.rich_text) {
          const text = richTextToNotionHtml(block.aside.rich_text);
          const children = block.children ? (await Promise.all(block.children.map((child: any) => blockToNotionHtml(child, 0)))).join("") : "";
          return `<blockquote class="block"${indentClass}>${text}${children}</blockquote>\n`;
        }
        if (block.children) {
          return (await Promise.all(block.children.map((child: any) => blockToNotionHtml(child, indent)))).join("");
        }
        return "";

      case "synced_block":
      case "unsupported":
        return "";

      default: {
        // Fallback: try to render children (e.g. aside, synced_block content)
        if (block.children) {
          return (await Promise.all(block.children.map((child: any) => blockToNotionHtml(child, indent)))).join("");
        }
        return "";
      }
    }
  } catch (err) {
    console.warn(`Failed to convert block ${block.id} of type ${type}:`, err);
    return "";
  }
}

/**
 * Convert Notion rich text to HTML with all annotations
 */
function richTextToNotionHtml(richText: any[]): string {
  if (!richText || richText.length === 0) return "";

  return richText
    .map((text) => {
      let html = escapeHtml(text.plain_text || "");

      // Apply annotations in order (innermost to outermost)
      if (text.annotations?.code) html = `<code>${html}</code>`;
      if (text.annotations?.bold) html = `<strong>${html}</strong>`;
      if (text.annotations?.italic) html = `<em>${html}</em>`;
      if (text.annotations?.strikethrough) html = `<s>${html}</s>`;
      if (text.annotations?.underline) html = `<u>${html}</u>`;

      // Apply color
      if (text.annotations?.color && text.annotations.color !== "default") {
        const colorClass = text.annotations.color.replace(/_/g, "-");
        html = `<span class="${colorClass}">${html}</span>`;
      }

      // Add link if present
      if (text.href) {
        html = `<a href="${escapeHtml(text.href)}" target="_blank" style="text-decoration: underline;">${html}</a>`;
      }

      return html;
    })
    .join("");
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Validate a Notion API key by making a test request
 */
export async function validateNotionApiKey(apiKey: string): Promise<boolean> {
  try {
    const notion = new Client({ auth: apiKey });
    await notion.users.me({});
    return true;
  } catch {
    return false;
  }
}

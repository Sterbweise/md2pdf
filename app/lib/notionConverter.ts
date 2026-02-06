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
 * Fetch a Notion page and convert it to Markdown
 */
export async function fetchNotionPage(
  pageUrl: string,
  apiKey: string
): Promise<{ markdown: string; title: string }> {
  // Initialize Notion client
  const notion = new Client({
    auth: apiKey,
  });

  // Extract page ID
  const pageId = extractPageId(pageUrl);

  // Get page metadata for title
  let title = "Untitled";
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
  } catch (error) {
    console.warn("Could not retrieve page title:", error);
  }

  // Initialize notion-to-md converter
  const n2m = new NotionToMarkdown({
    notionClient: notion,
    config: {
      parseChildPages: false, // Don't recursively parse child pages
      separateChildPage: true,
    },
  });

  // Configure custom transformers for better markdown output
  n2m.setCustomTransformer("callout", async (block) => {
    if (block.type !== "callout") return false;
    const callout = block.callout;
    const emoji =
      callout.icon?.type === "emoji" ? callout.icon.emoji + " " : "";
    const text = callout.rich_text.map((t) => t.plain_text).join("");
    return `> ${emoji}${text}`;
  });

  n2m.setCustomTransformer("toggle", async (block) => {
    if (block.type !== "toggle") return false;
    const toggle = block.toggle;
    const text = toggle.rich_text.map((t) => t.plain_text).join("");
    return `<details>\n<summary>${text}</summary>\n\n</details>`;
  });

  // Convert page to markdown
  const mdBlocks = await n2m.pageToMarkdown(pageId);
  const mdString = n2m.toMarkdownString(mdBlocks);

  // Combine title and content
  const markdown = `# ${title}\n\n${mdString.parent}`;

  return { markdown, title };
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

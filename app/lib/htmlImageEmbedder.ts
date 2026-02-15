export type HtmlImageMap = Record<string, string>;

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function findDataUri(src: string, imageMap: HtmlImageMap): string | undefined {
  const decodedSrc = safeDecode(src);
  return (
    imageMap[src] ||
    imageMap[decodedSrc] ||
    imageMap[src.replace(/^\.\//, "")] ||
    imageMap[decodedSrc.replace(/^\.\//, "")] ||
    imageMap[src.split("/").pop() || ""] ||
    imageMap[decodedSrc.split("/").pop() || ""]
  );
}

export function embedImagesInHtml(
  html: string,
  imageMap?: HtmlImageMap | null
): string {
  if (!imageMap || Object.keys(imageMap).length === 0) {
    return html;
  }

  let content = html;

  content = content.replace(
    /(<img[^>]+src=["'])([^"']+)(["'][^>]*>)/gi,
    (match, prefix, src, suffix) => {
      const dataUri = findDataUri(src, imageMap);
      return dataUri ? `${prefix}${dataUri}${suffix}` : match;
    }
  );

  content = content.replace(/url\(["']?([^"')]+)["']?\)/gi, (match, url) => {
    const dataUri = findDataUri(url, imageMap);
    return dataUri ? `url("${dataUri}")` : match;
  });

  return content;
}

/**
 * Embed images in markdown by replacing relative paths with data URIs from imageMap.
 * Used when exporting to PDF so images from ZIP imports render correctly.
 */
export function embedImagesInMarkdown(
  markdown: string,
  imageMap?: HtmlImageMap | null
): string {
  if (!imageMap || Object.keys(imageMap).length === 0) {
    return markdown;
  }

  return markdown.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (match, alt, src) => {
      const dataUri = findDataUri(src, imageMap);
      return dataUri ? `![${alt}](${dataUri})` : match;
    }
  );
}

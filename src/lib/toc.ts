export interface TocItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Extracts headings (h2, h3) from HTML, ensures every heading has a unique URL-safe id,
 * and returns both the ToC items list and the enhanced HTML with id anchors.
 */
export function extractAndInjectToc(html: string): {
  headings: TocItem[];
  enhancedHtml: string;
} {
  if (!html) return { headings: [], enhancedHtml: "" };

  const headings: TocItem[] = [];
  const usedSlugs = new Set<string>();

  function createSlug(text: string): string {
    const raw = text
      .toLowerCase()
      .replace(/<[^>]*>/g, "")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    let slug = raw || "heading";
    let counter = 1;
    while (usedSlugs.has(slug)) {
      slug = `${raw}-${counter}`;
      counter++;
    }
    usedSlugs.add(slug);
    return slug;
  }

  // Regex to match h2 and h3 tags
  const headingRegex = /<(h[23])([^>]*)>(.*?)<\/\1>/gi;

  const enhancedHtml = html.replace(headingRegex, (fullMatch, tag, attributes, innerContent) => {
    const level = parseInt(tag.charAt(1), 10);
    const cleanText = innerContent.replace(/<[^>]*>/g, "").trim();

    // Check if an id is already present
    const idMatch = attributes.match(/id=["'](.*?)["']/i);
    let id = idMatch ? idMatch[1] : "";

    if (!id) {
      id = createSlug(cleanText);
      // Inject id attribute
      attributes = ` id="${id}"${attributes}`;
    } else {
      usedSlugs.add(id);
    }

    headings.push({
      id,
      text: cleanText,
      level,
    });

    return `<${tag}${attributes}>${innerContent}</${tag}>`;
  });

  return { headings, enhancedHtml };
}

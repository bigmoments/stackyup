import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "p",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "strong",
  "em",
  "a",
  "img",
  "blockquote",
  "code",
  "pre",
  "span",
  "figure",
  "figcaption",
];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  a: ["href", "name", "target", "rel", "title"],
  img: ["src", "srcset", "alt", "title", "width", "height", "loading"],
  table: ["class", "border"],
  th: ["scope", "colspan", "rowspan"],
  td: ["colspan", "rowspan"],
  code: ["class"],
  pre: ["class"],
  "*": ["id", "class"],
};

export function cleanHtml(rawHtml: string): string {
  if (!rawHtml || typeof rawHtml !== "string") return "";

  return sanitizeHtml(rawHtml, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: (tagName, attribs) => {
        // Enforce rel="noopener noreferrer" for external links
        const href = attribs.href || "";
        const isExternal = href.startsWith("http://") || href.startsWith("https://");
        return {
          tagName,
          attribs: {
            ...attribs,
            ...(isExternal ? { rel: "noopener noreferrer" } : {}),
          },
        };
      },
    },
  });
}

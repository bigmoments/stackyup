import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "caption",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "del",
  "strike",
  "mark",
  "sub",
  "sup",
  "a",
  "img",
  "blockquote",
  "code",
  "pre",
  "span",
  "div",
  "hr",
  "figure",
  "figcaption",
  "iframe",
];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  a: ["href", "name", "target", "rel", "title", "class"],
  img: ["src", "srcset", "alt", "title", "width", "height", "loading", "class", "style"],
  table: ["class", "border", "cellpadding", "cellspacing"],
  th: ["scope", "colspan", "rowspan", "class"],
  td: ["colspan", "rowspan", "class"],
  code: ["class"],
  pre: ["class"],
  div: ["class", "id", "style"],
  span: ["class", "style"],
  mark: ["class"],
  hr: ["class"],
  iframe: ["src", "width", "height", "frameborder", "allow", "allowfullscreen", "class", "title"],
  "*": ["id", "class", "style"],
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

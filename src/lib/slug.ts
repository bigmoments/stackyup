import { eq, and, ne } from "drizzle-orm";
import { db, schema } from "@/db";

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/&/g, "-and-") // Replace & with 'and'
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

export async function getUniqueSlug(
  baseInput: string,
  target: "posts" | "pages" = "posts",
  excludeId?: string
): Promise<string> {
  const baseSlug = slugify(baseInput) || "post";
  let candidate = baseSlug;
  let counter = 1;

  while (true) {
    let exists = false;

    if (target === "posts") {
      const condition = excludeId
        ? and(eq(schema.posts.slug, candidate), ne(schema.posts.id, excludeId))
        : eq(schema.posts.slug, candidate);

      const found = await db.select({ id: schema.posts.id }).from(schema.posts).where(condition).limit(1);
      exists = found.length > 0;
    } else {
      const condition = excludeId
        ? and(eq(schema.pages.slug, candidate), ne(schema.pages.id, excludeId))
        : eq(schema.pages.slug, candidate);

      const found = await db.select({ id: schema.pages.id }).from(schema.pages).where(condition).limit(1);
      exists = found.length > 0;
    }

    if (!exists) {
      return candidate;
    }

    counter++;
    candidate = `${baseSlug}-${counter}`;
  }
}

import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import AuthorsClient, { AuthorItem } from "./AuthorsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Authors & Personas — StackYup Admin",
};

export default async function AdminAuthorsPage() {
  // Ensure default author exists if table is empty
  let authorsList = await db
    .select()
    .from(schema.authors)
    .orderBy(desc(schema.authors.isDefault), desc(schema.authors.createdAt));

  const defaultAuthorSettingRecord = await db
    .select()
    .from(schema.siteSettings)
    .where(eq(schema.siteSettings.key, "default_author_name"))
    .limit(1);

  const defaultAuthorSetting = defaultAuthorSettingRecord[0]?.value || "Adit";

  if (authorsList.length === 0) {
    // Seed initial authors for convenience
    try {
      await db.insert(schema.authors).values([
        {
          id: "auth_adit",
          name: defaultAuthorSetting,
          slug: defaultAuthorSetting.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          role: "Lead Editor & Founder",
          bio: "Tech enthusiast, developer, and writer testing cutting-edge AI tools and developer platforms.",
          isDefault: true,
          articleCount: 0,
        },
        {
          id: "auth_editorial",
          name: "StackYup Editorial Team",
          slug: "stackyup-editorial-team",
          role: "Editorial Desk",
          bio: "Curated research and collective deep dives from the StackYup benchmark review squad.",
          isDefault: false,
          articleCount: 0,
        },
        {
          id: "auth_hermes",
          name: "Hermes AI Benchmark",
          slug: "hermes-ai-benchmark",
          role: "Automated Benchmark Reporter",
          bio: "Automated benchmark runs, latency analytics, and model performance reports.",
          isDefault: false,
          articleCount: 0,
        },
      ]);

      authorsList = await db
        .select()
        .from(schema.authors)
        .orderBy(desc(schema.authors.isDefault), desc(schema.authors.createdAt));
    } catch (e) {
      console.error("Initial author seed error:", e);
    }
  }

  const formattedAuthors: AuthorItem[] = authorsList.map((a) => ({
    id: a.id,
    name: a.name,
    slug: a.slug,
    role: a.role,
    bio: a.bio,
    avatarUrl: a.avatarUrl,
    websiteUrl: a.websiteUrl,
    twitterHandle: a.twitterHandle,
    isDefault: a.isDefault,
    articleCount: a.articleCount,
    createdAt: a.createdAt,
  }));

  return (
    <AuthorsClient
      initialAuthors={formattedAuthors}
      defaultAuthorSetting={defaultAuthorSetting}
    />
  );
}

import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import TagsClient from "./TagsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tags — StackYup Admin",
};

export default async function AdminTagsPage() {
  const tagsList = await db
    .select()
    .from(schema.tags)
    .orderBy(desc(schema.tags.articleCount));

  return <TagsClient initialTags={tagsList} />;
}

import { desc } from "drizzle-orm";
import { FolderTree } from "lucide-react";
import { db, schema } from "@/db";
import CategoriesClient from "./CategoriesClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Categories — StackYup Admin",
};

export default async function AdminCategoriesPage() {
  const categoriesList = await db
    .select()
    .from(schema.categories)
    .orderBy(desc(schema.categories.articleCount));

  return <CategoriesClient initialCategories={categoriesList} />;
}

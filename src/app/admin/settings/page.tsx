import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Site Settings — StackYup Admin",
};

export default async function AdminSettingsPage() {
  const [records, authorsList] = await Promise.all([
    db.select().from(schema.siteSettings),
    db.select().from(schema.authors).orderBy(desc(schema.authors.isDefault), desc(schema.authors.createdAt)).catch(() => []),
  ]);

  const settings: Record<string, string> = {};
  for (const r of records) {
    settings[r.key] = r.value;
  }

  const authors = authorsList.map((a) => ({
    id: a.id,
    name: a.name,
    role: a.role,
    isDefault: a.isDefault,
  }));

  return <SettingsClient initialSettings={settings} authorsList={authors} />;
}

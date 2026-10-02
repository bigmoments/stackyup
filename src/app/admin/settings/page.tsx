import { db, schema } from "@/db";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Site Settings — StackYup Admin",
};

export default async function AdminSettingsPage() {
  const records = await db.select().from(schema.siteSettings);
  const settings: Record<string, string> = {};
  for (const r of records) {
    settings[r.key] = r.value;
  }

  return <SettingsClient initialSettings={settings} />;
}

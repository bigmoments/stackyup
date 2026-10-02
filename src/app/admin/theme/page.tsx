import { db, schema } from "@/db";
import ThemeClient from "./ThemeClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Theme & Design System — StackYup Admin",
};

export default async function AdminThemePage() {
  const records = await db.select().from(schema.siteSettings);
  const map = new Map(records.map((r) => [r.key, r.value]));

  const brandColor = map.get("brand_color") || "#079653";
  const themeFont = map.get("theme_font") || "Plus Jakarta Sans";
  const siteName = map.get("site_name") || "StackYup";
  const siteTagline = map.get("site_tagline") || "Modern AI & Tech Tools for Freelancers";

  return (
    <ThemeClient
      initialBrandColor={brandColor}
      initialFont={themeFont}
      initialSiteName={siteName}
      initialTagline={siteTagline}
    />
  );
}

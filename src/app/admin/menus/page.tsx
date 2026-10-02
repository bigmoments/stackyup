import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import MenusClient, { MenuItem } from "./MenusClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Menus & Navigation — StackYup Admin",
};

const defaultHeaderMenu: MenuItem[] = [
  { id: "h1", label: "For You", href: "/" },
  { id: "h2", label: "AI Tools", href: "/category/ai-tools" },
  { id: "h3", label: "Comparisons", href: "/category/comparisons" },
  { id: "h4", label: "Freelancers", href: "/category/freelancers" },
  { id: "h5", label: "Reviews", href: "/category/reviews" },
  { id: "h6", label: "Productivity", href: "/category/productivity" },
  { id: "h7", label: "Tech", href: "/category/tech" },
];

const defaultFooterMenu: MenuItem[] = [
  { id: "f1", label: "About StackYup", href: "/page/about" },
  { id: "f2", label: "Editorial Policy", href: "/page/editorial-policy" },
  { id: "f3", label: "Privacy Policy", href: "/page/privacy-policy" },
  { id: "f4", label: "Terms of Service", href: "/page/terms" },
  { id: "f5", label: "Contact Us", href: "/page/contact" },
];

export default async function AdminMenusPage() {
  const records = await db.select().from(schema.siteSettings);
  const map = new Map(records.map((r) => [r.key, r.value]));

  let headerMenu: MenuItem[] = defaultHeaderMenu;
  let footerMenu: MenuItem[] = defaultFooterMenu;

  if (map.has("header_menu")) {
    try {
      headerMenu = JSON.parse(map.get("header_menu")!);
    } catch {}
  }

  if (map.has("footer_menu")) {
    try {
      footerMenu = JSON.parse(map.get("footer_menu")!);
    } catch {}
  }

  return (
    <MenusClient
      initialHeaderMenu={headerMenu}
      initialFooterMenu={footerMenu}
    />
  );
}

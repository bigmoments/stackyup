import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentAdmin } from "@/lib/admin-session";
import { errorResponse, successResponse } from "@/lib/response";

export interface MenuItem {
  id: string;
  label: string;
  href: string;
  isExternal?: boolean;
}

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

export async function GET() {
  try {
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

    return successResponse({ headerMenu, footerMenu });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentAdmin();
    if (!session) return errorResponse("UNAUTHORIZED", "Unauthorized", null, 401);

    const body = await request.json();
    const { headerMenu, footerMenu } = body;

    const upsertSetting = async (key: string, value: string) => {
      const existing = await db
        .select()
        .from(schema.siteSettings)
        .where(eq(schema.siteSettings.key, key))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(schema.siteSettings)
          .set({ value, updatedAt: new Date() })
          .where(eq(schema.siteSettings.key, key));
      } else {
        await db.insert(schema.siteSettings).values({ key, value });
      }
    };

    if (Array.isArray(headerMenu)) {
      await upsertSetting("header_menu", JSON.stringify(headerMenu));
    }

    if (Array.isArray(footerMenu)) {
      await upsertSetting("footer_menu", JSON.stringify(footerMenu));
    }

    return successResponse({ message: "Navigation menus saved successfully" });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}

import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { signToken } from "../src/lib/admin-session";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

interface AdminRouteTest {
  section: string;
  name: string;
  path: string;
  expectedKeyword: string;
}

const ADMIN_ROUTES: AdminRouteTest[] = [
  // Top Level
  { section: "DASHBOARD", name: "Dashboard", path: "/admin", expectedKeyword: "Dashboard" },

  // Content
  { section: "CONTENT", name: "Posts List", path: "/admin/posts", expectedKeyword: "Articles" },
  { section: "CONTENT", name: "New Post Editor", path: "/admin/posts/new", expectedKeyword: "Editor" },
  { section: "CONTENT", name: "Categories", path: "/admin/categories", expectedKeyword: "Categories" },
  { section: "CONTENT", name: "Tags", path: "/admin/tags", expectedKeyword: "Tags" },
  { section: "CONTENT", name: "Media Assets", path: "/admin/media", expectedKeyword: "Media" },
  { section: "CONTENT", name: "Static Pages", path: "/admin/pages", expectedKeyword: "Static Pages" },
  { section: "CONTENT", name: "Comments Moderation", path: "/admin/comments", expectedKeyword: "Comments" },

  // Appearance
  { section: "APPEARANCE", name: "Site Settings", path: "/admin/settings", expectedKeyword: "Site Settings" },
  { section: "APPEARANCE", name: "Navigation Menus", path: "/admin/menus", expectedKeyword: "Menus" },
  { section: "APPEARANCE", name: "Theme & Design", path: "/admin/theme", expectedKeyword: "Theme" },

  // Engagement
  { section: "ENGAGEMENT", name: "Newsletter Campaigns", path: "/admin/newsletter", expectedKeyword: "Newsletter" },
  { section: "ENGAGEMENT", name: "Subscribers", path: "/admin/subscribers", expectedKeyword: "Subscribers" },
  { section: "ENGAGEMENT", name: "Analytics", path: "/admin/analytics", expectedKeyword: "Analytics" },

  // Monetization
  { section: "MONETIZATION", name: "Ad Placements", path: "/admin/advertisements", expectedKeyword: "Ad Placements" },
  { section: "MONETIZATION", name: "Affiliate Links", path: "/admin/affiliates", expectedKeyword: "Affiliate" },

  // AI & Agents
  { section: "AI & AGENTS", name: "AI Agents Hub", path: "/admin/ai-agents", expectedKeyword: "AI Agents" },
  { section: "AI & AGENTS", name: "API Keys", path: "/admin/api-keys", expectedKeyword: "API Keys" },

  // Tools
  { section: "TOOLS", name: "SEO Health Audit", path: "/admin/seo", expectedKeyword: "SEO" },
  { section: "TOOLS", name: "XML Sitemap", path: "/admin/sitemap", expectedKeyword: "Sitemap" },
  { section: "TOOLS", name: "URL Redirects", path: "/admin/redirects", expectedKeyword: "Redirects" },
  { section: "TOOLS", name: "Blogger/WP Importer", path: "/admin/import", expectedKeyword: "Importer" },

  // System
  { section: "SYSTEM", name: "Admin Users", path: "/admin/users", expectedKeyword: "Users" },
  { section: "SYSTEM", name: "System & Cache Diagnostics", path: "/admin/system", expectedKeyword: "Diagnostics" },
  { section: "SYSTEM", name: "Database Backups", path: "/admin/backups", expectedKeyword: "Backups" },
];

async function main() {
  console.log("==========================================================");
  console.log("🛡️  STACKYUP CMS: ADMIN SIDEBAR FULL ROUTE AUDIT");
  console.log(`📡 Target Server: ${BASE_URL}`);
  console.log("==========================================================\n");

  const sessionToken = signToken({
    email: "admin@stackyup.com",
    iat: Date.now(),
    exp: Date.now() + 86400000,
  });

  const cookieHeader = `sy_admin_session=${sessionToken}`;
  let passed = 0;
  let failed = 0;

  for (const route of ADMIN_ROUTES) {
    const url = `${BASE_URL}${route.path}`;
    const start = performance.now();

    try {
      const res = await fetch(url, {
        headers: {
          Cookie: cookieHeader,
          Accept: "text/html,application/xhtml+xml",
        },
      });

      const elapsed = Math.round(performance.now() - start);
      const text = await res.text();

      const is200 = res.status === 200;
      const hasKeyword = text.toLowerCase().includes(route.expectedKeyword.toLowerCase());

      if (is200 && hasKeyword) {
        console.log(`  ✓ [${route.section}] ${route.name.padEnd(26)} -> HTTP ${res.status} (${elapsed}ms)`);
        passed++;
      } else {
        console.error(`  ✗ [${route.section}] ${route.name.padEnd(26)} -> FAIL! status: ${res.status}, keyword '${route.expectedKeyword}' found: ${hasKeyword}`);
        failed++;
      }
    } catch (err: any) {
      console.error(`  ✗ [${route.section}] ${route.name.padEnd(26)} -> Network/Server Error: ${err.message}`);
      failed++;
    }
  }

  console.log("\n==========================================================");
  console.log(`Audit Summary: ${passed} PASSED, ${failed} FAILED out of ${ADMIN_ROUTES.length} routes`);
  console.log("==========================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal audit error:", err);
  process.exit(1);
});

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, schema } from "./index";
import { runMigrations } from "./migrate";
import { generateApiKey } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function seed() {
  console.log("Ensuring database migrations are up to date...");
  await runMigrations();

  console.log("Seeding initial data...");

  // 1. Check or create default Muse API Key
  const existingKeys = await db.select().from(schema.apiKeys).limit(1);
  let activeKey = "";

  if (existingKeys.length === 0) {
    const { key, keyHash, keyPrefix } = generateApiKey();
    activeKey = key;
    const keyId = `k_${nanoid(16)}`;

    await db.insert(schema.apiKeys).values({
      id: keyId,
      name: "Default Muse Production Key",
      keyHash,
      keyPrefix,
      isActive: true,
    });

    console.log("--------------------------------------------------");
    console.log("GENERATED NEW MUSE API KEY:");
    console.log(`Key: ${activeKey}`);
    console.log("--------------------------------------------------");

    // Write or update .env.local
    const envPath = path.resolve(process.cwd(), ".env.local");
    let envContent = "";
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf-8");
    }

    if (!envContent.includes("CMS_API_KEY")) {
      const newLine = `\nCMS_API_KEY=${activeKey}\n`;
      fs.appendFileSync(envPath, newLine);
      console.log("Saved CMS_API_KEY to .env.local");
    }
  } else {
    console.log("API Key already exists in database.");
  }

  // 2. Check or create default Admin user
  const adminPassword = process.env.ADMIN_PASSWORD || "stackyup2026!";
  const passwordHash = bcrypt.hashSync(adminPassword, 10);
  const existingAdmins = await db.select().from(schema.admins).limit(1);

  if (existingAdmins.length === 0) {
    const adminId = `adm_${nanoid(16)}`;
    await db.insert(schema.admins).values({
      id: adminId,
      email: "admin@stackyup.com",
      passwordHash: passwordHash,
      role: "admin",
    });
    console.log(`Created default admin record (admin@stackyup.com / ${adminPassword})`);
  } else {
    // Ensure admin has valid bcrypt password
    await db.update(schema.admins).set({ passwordHash }).where(eq(schema.admins.id, existingAdmins[0].id));
    console.log(`Updated admin password for ${existingAdmins[0].email}`);
  }

  // 3. Seed default Categories if empty
  const existingCategories = await db.select().from(schema.categories).limit(1);
  if (existingCategories.length === 0) {
    const defaultCats = [
      { id: "cat_ai_tools", name: "AI Tools", slug: "ai-tools", description: "Best AI tools and workflows for professionals", articleCount: 14 },
      { id: "cat_comparisons", name: "Comparisons", slug: "comparisons", description: "In-depth side-by-side tool comparisons and benchmarks", articleCount: 8 },
      { id: "cat_productivity", name: "Productivity", slug: "productivity", description: "Guides to automating work and scaling output", articleCount: 11 },
      { id: "cat_tech", name: "Tech", slug: "tech", description: "Developer tools, machine learning, and emerging trends", articleCount: 6 },
      { id: "cat_freelancers", name: "Freelancers", slug: "freelancers", description: "Business, clients, and contracts for indie creators", articleCount: 5 },
      { id: "cat_reviews", name: "Reviews", slug: "reviews", description: "Honest software and service reviews", articleCount: 4 },
    ];
    for (const c of defaultCats) {
      await db.insert(schema.categories).values(c).onConflictDoNothing();
    }
    console.log("Seeded default categories.");
  }

  // 4. Seed default Tags if empty
  const existingTags = await db.select().from(schema.tags).limit(1);
  if (existingTags.length === 0) {
    const defaultTags = [
      { id: "tag_claude", name: "Claude", slug: "claude", articleCount: 6 },
      { id: "tag_chatgpt", name: "ChatGPT", slug: "chatgpt", articleCount: 8 },
      { id: "tag_notion", name: "Notion", slug: "notion", articleCount: 4 },
      { id: "tag_freelancing", name: "Freelancing", slug: "freelancing", articleCount: 9 },
      { id: "tag_automation", name: "Automation", slug: "automation", articleCount: 7 },
    ];
    for (const t of defaultTags) {
      await db.insert(schema.tags).values(t).onConflictDoNothing();
    }
    console.log("Seeded default tags.");
  }

  // 5. Seed default Subscribers if empty
  const existingSubscribers = await db.select().from(schema.subscribers).limit(1);
  if (existingSubscribers.length === 0) {
    const defaultSubs = [
      { id: "sub_1", email: "alex.turner@example.com", status: "active", source: "article_newsletter_box" },
      { id: "sub_2", email: "rachel.green@company.io", status: "active", source: "homepage_footer" },
      { id: "sub_3", email: "david.beck@freelance.org", status: "active", source: "lead_magnet_ai" },
    ];
    for (const s of defaultSubs) {
      await db.insert(schema.subscribers).values(s).onConflictDoNothing();
    }
    console.log("Seeded default subscribers.");
  }

  // 6. Seed default Comments if empty
  const existingComments = await db.select().from(schema.comments).limit(1);
  if (existingComments.length === 0) {
    const firstPost = (await db.select().from(schema.posts).limit(1))[0];
    const postId = firstPost?.id || "p1";
    const postTitle = firstPost?.title || "7 Best AI Tools for Freelancers in 2026";

    const defaultComments = [
      {
        id: "com_1",
        postId,
        postTitle,
        authorName: "Rizky",
        authorEmail: "rizky@techreview.id",
        content: "Great comparison! This really helps me choose between Claude and ChatGPT.",
        status: "approved",
      },
      {
        id: "com_2",
        postId,
        postTitle: "How to Automate Repetitive Tasks as a Freelancer",
        authorName: "Sinta",
        authorEmail: "sinta@freelance.co",
        content: "Thanks for the detailed guide 🙏",
        status: "approved",
      },
      {
        id: "com_3",
        postId,
        postTitle,
        authorName: "Budi",
        authorEmail: "budi@agency.com",
        content: "Very useful! Can you also cover pricing comparison between tiers?",
        status: "approved",
      },
    ];
    for (const com of defaultComments) {
      await db.insert(schema.comments).values(com).onConflictDoNothing();
    }
    console.log("Seeded default comments.");
  }

  // 7. Seed default Site Settings
  const defaultSettings = [
    { key: "site_name", value: "StackYup" },
    { key: "site_tagline", value: "Modern AI & Tech Tools for Freelancers" },
    { key: "site_url", value: "http://localhost:3000" },
    { key: "admin_email", value: "admin@stackyup.com" },
    { key: "posts_per_page", value: "10" },
  ];
  for (const s of defaultSettings) {
    await db.insert(schema.siteSettings).values(s).onConflictDoNothing();
  }

  console.log("Database seeding completed.");
  return activeKey;
}

if (process.argv[1]?.includes("seed")) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seeding failed:", err);
      process.exit(1);
    });
}

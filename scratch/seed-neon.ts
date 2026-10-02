import pg from "pg";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(".env.local") });
dotenv.config();

async function seedNeon() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  console.log("Seeding Neon...");

  // 1. Categories
  const cats = [
    { id: "cat_ai_tools", name: "AI Tools", slug: "ai-tools", description: "Best AI tools and workflows for professionals", articleCount: 14 },
    { id: "cat_comparisons", name: "Comparisons", slug: "comparisons", description: "In-depth side-by-side tool comparisons and benchmarks", articleCount: 8 },
    { id: "cat_productivity", name: "Productivity", slug: "productivity", description: "Guides to automating work and scaling output", articleCount: 11 },
    { id: "cat_tech", name: "Tech", slug: "tech", description: "Developer tools, machine learning, and emerging trends", articleCount: 6 },
    { id: "cat_freelancers", name: "Freelancers", slug: "freelancers", description: "Business, clients, and contracts for indie creators", articleCount: 5 },
    { id: "cat_reviews", name: "Reviews", slug: "reviews", description: "Honest software and service reviews", articleCount: 4 },
  ];
  for (const c of cats) {
    await pool.query(
      `INSERT INTO categories (id, name, slug, description, article_count) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (slug) DO NOTHING`,
      [c.id, c.name, c.slug, c.description, c.articleCount]
    );
  }

  // 2. Tags
  const tags = [
    { id: "tag_claude", name: "Claude", slug: "claude", articleCount: 6 },
    { id: "tag_chatgpt", name: "ChatGPT", slug: "chatgpt", articleCount: 8 },
    { id: "tag_notion", name: "Notion", slug: "notion", articleCount: 4 },
    { id: "tag_freelancing", name: "Freelancing", slug: "freelancing", articleCount: 9 },
    { id: "tag_automation", name: "Automation", slug: "automation", articleCount: 7 },
  ];
  for (const t of tags) {
    await pool.query(
      `INSERT INTO tags (id, name, slug, article_count) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (slug) DO NOTHING`,
      [t.id, t.name, t.slug, t.articleCount]
    );
  }

  // 3. Subscribers
  const subs = [
    { id: "sub_1", email: "alex.turner@example.com", status: "active", source: "article_newsletter_box" },
    { id: "sub_2", email: "rachel.green@company.io", status: "active", source: "homepage_footer" },
    { id: "sub_3", email: "david.beck@freelance.org", status: "active", source: "lead_magnet_ai" },
  ];
  for (const s of subs) {
    await pool.query(
      `INSERT INTO subscribers (id, email, status, source) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO NOTHING`,
      [s.id, s.email, s.status, s.source]
    );
  }

  // 4. Comments
  const firstPostRes = await pool.query("SELECT id, title FROM posts LIMIT 1");
  const firstPost = firstPostRes.rows[0];
  const postId = firstPost ? firstPost.id : "p1";
  const postTitle = firstPost ? firstPost.title : "7 Best AI Tools for Freelancers in 2026";

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
    await pool.query(
      `INSERT INTO comments (id, post_id, post_title, author_name, author_email, content, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       ON CONFLICT (id) DO NOTHING`,
      [com.id, com.postId, com.postTitle, com.authorName, com.authorEmail, com.content, com.status]
    );
  }

  console.log("Neon database successfully seeded with all initial data!");
  await pool.end();
}

seedNeon().catch(console.error);

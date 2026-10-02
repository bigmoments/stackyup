import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(".env.local") });
dotenv.config();

import pg from "pg";
import { PGlite } from "@electric-sql/pglite";
import fs from "fs";

const allTablesDDL = [
  // 1. api_keys
  `CREATE TABLE IF NOT EXISTS api_keys (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(64) NOT NULL UNIQUE,
    key_prefix VARCHAR(16) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
  );`,

  // 2. posts
  `CREATE TABLE IF NOT EXISTS posts (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content_html TEXT NOT NULL,
    excerpt VARCHAR(300),
    meta_description VARCHAR(160),
    featured_image_url TEXT,
    featured_image_alt VARCHAR(255),
    tags JSONB DEFAULT '[]'::jsonb NOT NULL,
    faq_json JSONB DEFAULT '[]'::jsonb,
    claps INTEGER DEFAULT 0 NOT NULL,
    author_name VARCHAR(100) DEFAULT 'Adit' NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' NOT NULL,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);`,
  `CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS claps INTEGER DEFAULT 0 NOT NULL;`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_name VARCHAR(100) DEFAULT 'Adit' NOT NULL;`,

  // 3. pages
  `CREATE TABLE IF NOT EXISTS pages (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content_html TEXT NOT NULL,
    meta_description VARCHAR(160),
    status VARCHAR(20) DEFAULT 'draft' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);`,

  // 4. media
  `CREATE TABLE IF NOT EXISTS media (
    id VARCHAR(64) PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    alt VARCHAR(255),
    width INTEGER,
    height INTEGER,
    size_bytes INTEGER,
    mime_type VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
  );`,

  // 5. admins
  `CREATE TABLE IF NOT EXISTS admins (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'admin' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
  );`,

  // 6. revisions
  `CREATE TABLE IF NOT EXISTS revisions (
    id VARCHAR(64) PRIMARY KEY,
    post_id VARCHAR(64),
    page_id VARCHAR(64),
    title VARCHAR(255),
    content_html TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
  );`,

  // 7. idempotency_keys
  `CREATE TABLE IF NOT EXISTS idempotency_keys (
    key VARCHAR(255) PRIMARY KEY,
    response_status INTEGER NOT NULL,
    response_body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
  );`,

  // 8. comments
  `CREATE TABLE IF NOT EXISTS comments (
    id VARCHAR(64) PRIMARY KEY,
    post_id VARCHAR(64) NOT NULL,
    author_name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);`,
  `ALTER TABLE comments ADD COLUMN IF NOT EXISTS post_title VARCHAR(255);`,
  `ALTER TABLE comments ADD COLUMN IF NOT EXISTS author_email VARCHAR(255);`,
  `ALTER TABLE comments ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'approved' NOT NULL;`,

  // 9. categories
  `CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    article_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
  );`,

  // 10. tags
  `CREATE TABLE IF NOT EXISTS tags (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    article_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
  );`,

  // 11. subscribers
  `CREATE TABLE IF NOT EXISTS subscribers (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'active' NOT NULL,
    source VARCHAR(50) DEFAULT 'website' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
  );`,

  // 12. redirects
  `CREATE TABLE IF NOT EXISTS redirects (
    id VARCHAR(64) PRIMARY KEY,
    from_path VARCHAR(255) NOT NULL UNIQUE,
    to_path VARCHAR(255) NOT NULL,
    status_code INTEGER DEFAULT 301 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
  );`,

  // 13. ad_placements
  `CREATE TABLE IF NOT EXISTS ad_placements (
    id VARCHAR(64) PRIMARY KEY,
    slot_key VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    provider VARCHAR(50) DEFAULT 'adsense' NOT NULL,
    ad_client VARCHAR(100),
    ad_slot VARCHAR(100),
    custom_html TEXT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
  );`,

  // 14. site_settings
  `CREATE TABLE IF NOT EXISTS site_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
  );`
];

const requiredTables = [
  "api_keys",
  "posts",
  "pages",
  "media",
  "admins",
  "revisions",
  "idempotency_keys",
  "comments",
  "categories",
  "tags",
  "subscribers",
  "redirects",
  "ad_placements",
  "site_settings",
];

async function verifyAll() {
  console.log("==========================================");
  console.log("STARTING FULL DATABASE MIGRATION & AUDIT");
  console.log("==========================================");

  // 1. Audit & Migrate Local PGlite
  console.log("\n[1/2] Checking Local PGlite Database (.data/pglite)...");
  const dataDir = path.resolve(".data", "pglite");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const pglite = new PGlite(dataDir);

  for (const ddl of allTablesDDL) {
    await pglite.query(ddl);
  }

  for (const table of requiredTables) {
    const res = await pglite.query<{ count: string | number }>(`SELECT COUNT(*) as count FROM ${table}`);
    console.log(`  ✓ Table '${table}': OK (${res.rows[0]?.count ?? 0} rows)`);
  }
  console.log("Local PGlite database is fully migrated and healthy!");

  // 2. Audit & Migrate Remote Neon PostgreSQL
  if (process.env.DATABASE_URL) {
    console.log("\n[2/2] Checking Remote Neon PostgreSQL...");
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    for (const ddl of allTablesDDL) {
      await pool.query(ddl);
    }

    for (const table of requiredTables) {
      const res = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`  ✓ Table '${table}': OK (${res.rows[0].count} rows)`);
    }

    await pool.end();
    console.log("Remote Neon PostgreSQL is fully migrated and healthy!");
  } else {
    console.log("\n[2/2] Remote DATABASE_URL not configured. Skipping remote audit.");
  }

  console.log("\n==========================================");
  console.log("ALL 14 DATABASE TABLES VERIFIED SUCCESSFULLY!");
  console.log("==========================================");
}

verifyAll().catch((err) => {
  console.error("Migration audit failed:", err);
  process.exit(1);
});

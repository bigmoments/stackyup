import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

import { sql } from "drizzle-orm";
import { db } from "./index";

export async function runMigrations() {
  console.log("Running database migrations...");

  const ddlStatements = [
    `CREATE TABLE IF NOT EXISTS api_keys (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      key_hash VARCHAR(64) NOT NULL UNIQUE,
      key_prefix VARCHAR(16) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE NOT NULL,
      last_used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    );`,

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
      status VARCHAR(20) DEFAULT 'draft' NOT NULL,
      published_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    );`,

    `CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);`,
    `CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);`,

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

    `CREATE TABLE IF NOT EXISTS admins (
      id VARCHAR(64) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role VARCHAR(50) DEFAULT 'admin' NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS revisions (
      id VARCHAR(64) PRIMARY KEY,
      post_id VARCHAR(64),
      page_id VARCHAR(64),
      title VARCHAR(255),
      content_html TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS idempotency_keys (
      key VARCHAR(255) PRIMARY KEY,
      response_status INTEGER NOT NULL,
      response_body TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS comments (
      id VARCHAR(64) PRIMARY KEY,
      post_id VARCHAR(64) NOT NULL,
      author_name VARCHAR(100) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    );`,

    `CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);`,

    `ALTER TABLE posts ADD COLUMN IF NOT EXISTS claps INTEGER DEFAULT 0 NOT NULL;`,
    `ALTER TABLE posts ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0 NOT NULL;`,
    `ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_name VARCHAR(100);`,
    `ALTER TABLE posts ALTER COLUMN author_name DROP NOT NULL;`,
    `ALTER TABLE comments ADD COLUMN IF NOT EXISTS post_title VARCHAR(255);`,
    `ALTER TABLE comments ADD COLUMN IF NOT EXISTS author_email VARCHAR(255);`,
    `ALTER TABLE comments ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'approved' NOT NULL;`,

    `CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      slug VARCHAR(100) NOT NULL UNIQUE,
      description VARCHAR(255),
      article_count INTEGER DEFAULT 0 NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS tags (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      slug VARCHAR(100) NOT NULL UNIQUE,
      article_count INTEGER DEFAULT 0 NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS subscribers (
      id VARCHAR(64) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      status VARCHAR(20) DEFAULT 'active' NOT NULL,
      source VARCHAR(50) DEFAULT 'website' NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS redirects (
      id VARCHAR(64) PRIMARY KEY,
      from_path VARCHAR(255) NOT NULL UNIQUE,
      to_path VARCHAR(255) NOT NULL,
      status_code INTEGER DEFAULT 301 NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    );`,

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

    `CREATE TABLE IF NOT EXISTS site_settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS authors (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      slug VARCHAR(100) NOT NULL UNIQUE,
      role VARCHAR(100),
      bio TEXT,
      avatar_url TEXT,
      website_url TEXT,
      twitter_handle VARCHAR(50),
      is_default BOOLEAN DEFAULT FALSE NOT NULL,
      article_count INTEGER DEFAULT 0 NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS affiliates (
      id VARCHAR(64) PRIMARY KEY,
      brand VARCHAR(100) NOT NULL,
      url TEXT NOT NULL,
      category VARCHAR(100),
      default_anchor_text VARCHAR(150),
      status VARCHAR(30) DEFAULT 'active' NOT NULL,
      disclosure_text TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS ad_slots (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      position VARCHAR(50) NOT NULL,
      network VARCHAR(50) DEFAULT 'adsense' NOT NULL,
      ad_client VARCHAR(100),
      ad_slot VARCHAR(100),
      format VARCHAR(50) DEFAULT 'auto',
      responsive BOOLEAN DEFAULT TRUE NOT NULL,
      status VARCHAR(30) DEFAULT 'active' NOT NULL,
      show_on VARCHAR(50) DEFAULT 'all' NOT NULL,
      exclude_slugs JSONB DEFAULT '[]'::jsonb NOT NULL,
      custom_code TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    );`
  ];

  for (const statement of ddlStatements) {
    await db.execute(sql.raw(statement));
  }

  // Also sync Neon PostgreSQL if DATABASE_URL is configured
  if (process.env.DATABASE_URL) {
    try {
      const pgModule = await import("pg");
      const { Pool } = pgModule.default || pgModule;
      const neonPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
      for (const statement of ddlStatements) {
        await neonPool.query(statement).catch(() => {});
      }
      await neonPool.end();
      console.log("Neon remote database synced.");
    } catch (e) {
      console.warn("Neon remote sync skipped:", e);
    }
  }

  console.log("Migrations applied successfully.");
}

// Allow direct execution via tsx
if (process.argv[1]?.includes("migrate")) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}


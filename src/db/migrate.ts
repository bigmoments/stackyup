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
    );`
  ];

  for (const statement of ddlStatements) {
    await db.execute(sql.raw(statement));
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

import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function initNeon() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  console.log("Connecting directly to Neon database...");
  const client = new pg.Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

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

  for (const stmt of ddlStatements) {
    await client.query(stmt);
  }
  console.log("All tables created successfully on Neon.");

  // Insert default API Key
  const rawKey = process.env.CMS_API_KEY || "sy_live_0c3f4dc22e7fd9b8ee43d8a0681ad7f179aace26b7bedd54";
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.slice(0, 8);

  const existingKeys = await client.query("SELECT id FROM api_keys WHERE key_hash = $1", [keyHash]);
  if (existingKeys.rows.length === 0) {
    await client.query(
      `INSERT INTO api_keys (id, name, key_hash, key_prefix, is_active) VALUES ($1, $2, $3, $4, $5)`,
      [`k_${nanoid(16)}`, "Default Muse Production Key", keyHash, keyPrefix, true]
    );
    console.log("Inserted active Muse API Key into Neon.");
  }

  // Insert default admin
  const adminPassword = process.env.ADMIN_PASSWORD || "stackyup2026!";
  const passwordHash = bcrypt.hashSync(adminPassword, 10);
  const existingAdmins = await client.query("SELECT id FROM admins WHERE email = $1", ["admin@stackyup.com"]);
  if (existingAdmins.rows.length === 0) {
    await client.query(
      `INSERT INTO admins (id, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
      [`adm_${nanoid(16)}`, "admin@stackyup.com", passwordHash, "admin"]
    );
    console.log("Inserted default admin into Neon (admin@stackyup.com)");
  }

  // Verify tables
  const res = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
  );
  console.log("Verified tables in Neon:", res.rows.map((r) => r.table_name));

  await client.end();
}

initNeon().catch((err) => {
  console.error("Init Neon failed:", err);
  process.exit(1);
});

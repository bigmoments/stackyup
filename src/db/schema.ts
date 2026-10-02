import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

// 1. API Keys table for Muse and Admin automation
export const apiKeys = pgTable("api_keys", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  keyHash: varchar("key_hash", { length: 64 }).notNull().unique(),
  keyPrefix: varchar("key_prefix", { length: 16 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 2. Posts table
export const posts = pgTable("posts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  contentHtml: text("content_html").notNull(),
  excerpt: varchar("excerpt", { length: 300 }),
  metaDescription: varchar("meta_description", { length: 160 }),
  featuredImageUrl: text("featured_image_url"),
  featuredImageAlt: varchar("featured_image_alt", { length: 255 }),
  tags: jsonb("tags").$type<string[]>().default([]).notNull(),
  faqJson: jsonb("faq_json").$type<{ question: string; answer: string }[]>().default([]),
  claps: integer("claps").default(0).notNull(),
  views: integer("views").default(0).notNull(),
  authorName: varchar("author_name", { length: 100 }), // Nullable; null indicates fallback to Site Settings
  status: varchar("status", { length: 20 }).default("draft").notNull(), // 'draft' | 'scheduled' | 'published'
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 3. Static Pages table
export const pages = pgTable("pages", {
  id: varchar("id", { length: 64 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  contentHtml: text("content_html").notNull(),
  metaDescription: varchar("meta_description", { length: 160 }),
  status: varchar("status", { length: 20 }).default("draft").notNull(), // 'draft' | 'published'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 4. Media table
export const media = pgTable("media", {
  id: varchar("id", { length: 64 }).primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  url: text("url").notNull(),
  alt: varchar("alt", { length: 255 }),
  width: integer("width"),
  height: integer("height"),
  sizeBytes: integer("size_bytes"),
  mimeType: varchar("mime_type", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 5. Admins table
export const admins = pgTable("admins", {
  id: varchar("id", { length: 64 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 50 }).default("admin").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 6. Revisions table
export const revisions = pgTable("revisions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  postId: varchar("post_id", { length: 64 }),
  pageId: varchar("page_id", { length: 64 }),
  title: varchar("title", { length: 255 }),
  contentHtml: text("content_html").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 7. Idempotency Keys table
export const idempotencyKeys = pgTable("idempotency_keys", {
  key: varchar("key", { length: 255 }).primaryKey(),
  responseStatus: integer("response_status").notNull(),
  responseBody: text("response_body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 8. Comments table
export const comments = pgTable("comments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  postId: varchar("post_id", { length: 64 }).notNull(),
  postTitle: varchar("post_title", { length: 255 }),
  authorName: varchar("author_name", { length: 100 }).notNull(),
  authorEmail: varchar("author_email", { length: 255 }),
  content: text("content").notNull(),
  status: varchar("status", { length: 20 }).default("approved").notNull(), // 'pending' | 'approved' | 'spam' | 'trash'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 9. Categories table
export const categories = pgTable("categories", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: varchar("description", { length: 255 }),
  articleCount: integer("article_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 10. Tags table
export const tags = pgTable("tags", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  articleCount: integer("article_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 11. Subscribers table
export const subscribers = pgTable("subscribers", {
  id: varchar("id", { length: 64 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  status: varchar("status", { length: 20 }).default("active").notNull(), // 'active' | 'unsubscribed'
  source: varchar("source", { length: 50 }).default("website").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 12. Redirects table
export const redirects = pgTable("redirects", {
  id: varchar("id", { length: 64 }).primaryKey(),
  fromPath: varchar("from_path", { length: 255 }).notNull().unique(),
  toPath: varchar("to_path", { length: 255 }).notNull(),
  statusCode: integer("status_code").default(301).notNull(), // 301 or 302
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 13. Ad Placements table
export const adPlacements = pgTable("ad_placements", {
  id: varchar("id", { length: 64 }).primaryKey(),
  slotKey: varchar("slot_key", { length: 100 }).notNull().unique(), // e.g. "article_sidebar", "in_article", "bottom_article"
  title: varchar("title", { length: 100 }).notNull(),
  isEnabled: boolean("is_enabled").default(false).notNull(),
  provider: varchar("provider", { length: 50 }).default("adsense").notNull(),
  adClient: varchar("ad_client", { length: 100 }),
  adSlot: varchar("ad_slot", { length: 100 }),
  customHtml: text("custom_html"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 14. Site Settings table
export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 15. Authors table
export const authors = pgTable("authors", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  role: varchar("role", { length: 100 }), // e.g. "Founder & Lead Writer", "Guest Contributor"
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  websiteUrl: text("website_url"),
  twitterHandle: varchar("twitter_handle", { length: 50 }),
  isDefault: boolean("is_default").default(false).notNull(),
  articleCount: integer("article_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 16. Affiliates table (Dedicated entity for API & Admin)
export const affiliates = pgTable("affiliates", {
  id: varchar("id", { length: 64 }).primaryKey(),
  brand: varchar("brand", { length: 100 }).notNull(),
  url: text("url").notNull(),
  category: varchar("category", { length: 100 }),
  defaultAnchorText: varchar("default_anchor_text", { length: 150 }),
  status: varchar("status", { length: 30 }).default("active").notNull(), // 'active' | 'inactive' | 'paused'
  disclosureText: text("disclosure_text"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 17. Ad Slots table (Dedicated entity for API & Theme placement)
export const adSlots = pgTable("ad_slots", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  position: varchar("position", { length: 50 }).notNull(), // 'header' | 'below_title' | 'in_content' | 'after_content' | 'sidebar' | 'footer'
  network: varchar("network", { length: 50 }).default("adsense").notNull(), // 'adsense' | 'custom' | 'direct'
  adClient: varchar("ad_client", { length: 100 }),
  adSlot: varchar("ad_slot", { length: 100 }),
  format: varchar("format", { length: 50 }).default("auto"), // 'auto' | 'fluid' | 'rectangle' | 'banner'
  responsive: boolean("responsive").default(true).notNull(),
  status: varchar("status", { length: 30 }).default("active").notNull(), // 'active' | 'inactive'
  showOn: varchar("show_on", { length: 50 }).default("all").notNull(), // 'all' | 'posts_only' | 'home_only'
  excludeSlugs: jsonb("exclude_slugs").$type<string[]>().default([]).notNull(),
  customCode: text("custom_code"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});



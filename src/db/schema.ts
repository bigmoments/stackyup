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

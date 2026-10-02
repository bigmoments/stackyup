import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}/api/v1`;

  const spec = {
    openapi: "3.1.0",
    info: {
      title: "StackYup CMS Publishing API for AI Agents",
      version: "1.0.0",
      description:
        "High-performance headless editorial and publishing API designed for autonomous AI agents like Muse AI, Hermes, and OpenClaw. Supports WebP hero uploads, idempotent article drafts, slug verification, and atomic publishing.",
    },
    servers: [
      {
        url: baseUrl,
        description: "Current StackYup API Environment",
      },
    ],
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
    paths: {
      "/media": {
        post: {
          summary: "Upload image (WebP/PNG/JPG)",
          description: "Uploads an illustration or featured image to Cloudinary CDN and returns the secure URL.",
          operationId: "uploadMedia",
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    file: {
                      type: "string",
                      format: "binary",
                      description: "Image file binary (max 5MB)",
                    },
                    alt: {
                      type: "string",
                      description: "Mandatory SEO alt text in English",
                    },
                  },
                  required: ["file"],
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Media uploaded successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      url: { type: "string" },
                      alt: { type: "string" },
                      width: { type: "integer" },
                      height: { type: "integer" },
                    },
                  },
                },
              },
            },
          },
        },
        get: {
          summary: "List media assets",
          description: "Retrieve a paginated list of previously uploaded media files.",
          operationId: "listMedia",
          parameters: [
            { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
            { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
          ],
          responses: {
            "200": {
              description: "List of media files",
            },
          },
        },
      },
      "/media/{id}": {
        get: {
          summary: "Get media asset by ID",
          description: "Retrieves media item details by ID.",
          operationId: "getMedia",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Media unique ID ('m_...')",
            },
          ],
          responses: {
            "200": { description: "Media asset details" },
            "404": { description: "Media not found" },
          },
        },
        delete: {
          summary: "Delete media asset",
          description: "Permanently deletes a media asset from library and Cloudinary/storage.",
          operationId: "deleteMedia",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Media unique ID ('m_...')",
            },
          ],
          responses: {
            "204": { description: "Media permanently deleted (No Content)" },
            "404": { description: "Media not found" },
          },
        },
      },
      "/posts": {
        post: {
          summary: "Create new article draft or post",
          description: "Creates an article draft with semantic HTML, tags, excerpt, SEO description, and structured FAQ schema.",
          operationId: "createPost",
          parameters: [
            {
              name: "Idempotency-Key",
              in: "header",
              required: false,
              schema: { type: "string" },
              description: "Unique UUID to prevent duplicate posts on network retry",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "Article title" },
                    slug: { type: "string", description: "Optional custom URL slug" },
                    content_html: { type: "string", description: "Clean semantic HTML content" },
                    excerpt: { type: "string", description: "Short summary (max 300 chars)" },
                    meta_description: { type: "string", description: "SEO description (130-160 chars)" },
                    featured_image_url: { type: "string", description: "Cloudinary image URL" },
                    featured_image_alt: { type: "string", description: "English alt text for featured image" },
                    tags: { type: "array", items: { type: "string" }, description: "Tags & categories" },
                    faq: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          question: { type: "string" },
                          answer: { type: "string" },
                        },
                        required: ["question", "answer"],
                      },
                      description: "FAQ pairs for Google FAQPage schema",
                    },
                    status: {
                      type: "string",
                      enum: ["draft", "scheduled", "published"],
                      default: "draft",
                    },
                    author_name: {
                      type: "string",
                      description: "Optional author persona override. If omitted, falls back to default_author_name in Site Settings.",
                    },
                    published_at: { type: "string", format: "date-time", nullable: true },
                  },
                  required: ["title", "content_html"],
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Post created successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      slug: { type: "string" },
                      url: { type: "string" },
                      status: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
        get: {
          summary: "List posts with filters",
          description: "Get published or draft posts with pagination and tag filter.",
          operationId: "listPosts",
          parameters: [
            { name: "status", in: "query", schema: { type: "string", enum: ["published", "draft", "scheduled"] } },
            { name: "tag", in: "query", schema: { type: "string" } },
            { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
            { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
          ],
          responses: {
            "200": { description: "List of posts" },
          },
        },
      },
      "/posts/{id_or_slug}": {
        get: {
          summary: "Get article details by slug or ID",
          description: "Retrieve complete article object in snake_case format for AI agent verification.",
          operationId: "getPost",
          parameters: [
            {
              name: "id_or_slug",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Article slug or unique ID",
            },
          ],
          responses: {
            "200": { description: "Article object" },
            "404": { description: "Article not found" },
          },
        },
        patch: {
          summary: "Update or publish article",
          description: "Update article fields or publish it by setting status: published.",
          operationId: "updatePost",
          parameters: [
            {
              name: "id_or_slug",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Article unique ID (p_...)",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    content_html: { type: "string" },
                    status: { type: "string", enum: ["draft", "scheduled", "published"] },
                    tags: { type: "array", items: { type: "string" } },
                    published_at: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Updated article" },
          },
        },
        delete: {
          summary: "Permanently delete post or draft",
          description: "Hard deletes a post by ID or slug along with its revisions and comments. Invalidates cache.",
          operationId: "deletePost",
          parameters: [
            {
              name: "id_or_slug",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Article ID ('p_...') or URL slug",
            },
          ],
          responses: {
            "204": { description: "Post permanently deleted (No Content)" },
            "404": { description: "Post not found" },
          },
        },
      },
      "/pages": {
        post: {
          summary: "Create new static page",
          description: "Creates a static page (e.g. About, Contact, Privacy Policy, Terms) with sanitized HTML.",
          operationId: "createPage",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "Page title" },
                    slug: { type: "string", description: "Optional custom URL slug" },
                    content_html: { type: "string", description: "Page body in clean semantic HTML" },
                    meta_description: { type: "string", description: "Page meta description" },
                    status: { type: "string", enum: ["draft", "published"], default: "draft" },
                  },
                  required: ["title", "content_html"],
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Page created successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      slug: { type: "string" },
                      url: { type: "string" },
                      status: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
        get: {
          summary: "List static pages",
          description: "Retrieve paginated list of static pages.",
          operationId: "listPages",
          parameters: [
            { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
            { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
          ],
          responses: {
            "200": { description: "List of static pages" },
          },
        },
      },
      "/pages/{id_or_slug}": {
        get: {
          summary: "Get static page details",
          description: "Retrieve a static page by ID or slug.",
          operationId: "getPage",
          parameters: [
            {
              name: "id_or_slug",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Page slug or unique ID",
            },
          ],
          responses: {
            "200": { description: "Page object" },
            "404": { description: "Page not found" },
          },
        },
        patch: {
          summary: "Update static page",
          description: "Update static page title, slug, content_html, meta_description, or status.",
          operationId: "updatePage",
          parameters: [
            {
              name: "id_or_slug",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Page unique ID or slug",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    slug: { type: "string" },
                    content_html: { type: "string" },
                    meta_description: { type: "string" },
                    status: { type: "string", enum: ["draft", "published"] },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Updated page object" },
          },
        },
        delete: {
          summary: "Permanently delete static page",
          description: "Hard deletes a static page by ID or slug along with revisions.",
          operationId: "deletePage",
          parameters: [
            {
              name: "id_or_slug",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Page unique ID or slug",
            },
          ],
          responses: {
            "204": { description: "Page permanently deleted (No Content)" },
            "404": { description: "Page not found" },
          },
        },
      },
      "/affiliates": {
        get: {
          summary: "List active affiliate partners",
          description: "Retrieve active affiliate partner links and anchor texts for AI agents to embed [affiliate id=\"...\"] shortcodes.",
          operationId: "listAffiliates",
          responses: {
            "200": {
              description: "List of active affiliate partners",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      items: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            brand: { type: "string" },
                            category: { type: "string" },
                            default_anchor_text: { type: "string" },
                            status: { type: "string" },
                          },
                        },
                      },
                      total: { type: "integer" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/settings": {
        get: {
          summary: "Get site configuration and default author name",
          description: "Retrieve public site settings including default_author_name, site_name, and public URLs.",
          operationId: "getSettings",
          responses: {
            "200": {
              description: "Public site settings",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      site_name: { type: "string" },
                      site_url: { type: "string" },
                      site_tagline: { type: "string" },
                      default_author_name: { type: "string" },
                      brand_color: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "API_KEY",
          description: "Provide StackYup API key in format: Bearer <API_KEY>",
        },
      },
    },
  };

  return NextResponse.json(spec, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

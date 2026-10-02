import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}/api/v1`;

  const mcpTools = {
    protocol_version: "2024-11-05",
    server: {
      name: "stackyup-cms-publisher",
      version: "1.0.0",
      description: "Model Context Protocol (MCP) server for StackYup headless publication, used by Muse AI, Hermes, and OpenClaw.",
    },
    tools: [
      {
        name: "stackyup_upload_media",
        description: "Uploads a human-provided WebP image (<slug>-<n>.webp) to Cloudinary CDN for use in StackYup articles.",
        inputSchema: {
          type: "object",
          properties: {
            file_url_or_base64: { type: "string", description: "Direct URL of image to upload, or multipart file" },
            alt: { type: "string", description: "Mandatory SEO alt text in English describing the graphic" },
          },
          required: ["alt"],
        },
      },
      {
        name: "stackyup_create_draft",
        description: "Creates an article draft on StackYup with semantic HTML, SEO meta, tags, and structured FAQ schema.",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Article title (ideal length: 40-70 characters)" },
            slug: { type: "string", description: "Custom URL slug (optional, auto-generated if omitted)" },
            content_html: { type: "string", description: "Article body in clean semantic HTML (h2, h3, p, table, ul, callouts)" },
            excerpt: { type: "string", description: "Engaging 1-2 sentence summary for article feed" },
            meta_description: { type: "string", description: "SEO meta description strictly between 130 and 160 characters" },
            featured_image_url: { type: "string", description: "Cloudinary WebP image URL from stackyup_upload_media" },
            featured_image_alt: { type: "string", description: "Alt text for the hero image" },
            tags: { type: "array", items: { type: "string" }, description: "Tags e.g. ['AI Tools', 'Comparisons']" },
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
              description: "Q&A list for Google FAQPage schema",
            },
            status: { type: "string", enum: ["draft", "scheduled", "published"], default: "draft" },
            published_at: { type: "string", description: "ISO 8601 timestamp (required when status is 'scheduled')" },
            author_name: {
              type: "string",
              description: "Optional author persona override. If omitted, falls back to default_author_name from Site Settings.",
            },
          },
          required: ["title", "content_html"],
        },
      },
      {
        name: "stackyup_verify_post",
        description: "Fetches full details of a draft or published post by slug or ID to verify formatting and content accuracy.",
        inputSchema: {
          type: "object",
          properties: {
            id_or_slug: { type: "string", description: "Article slug (e.g. '7-best-ai-tools-2026') or ID ('p_...')" },
          },
          required: ["id_or_slug"],
        },
      },
      {
        name: "stackyup_publish_post",
        description: "Atomically publishes an article draft on StackYup so it appears live on the homepage and RSS feed.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "Post ID (e.g. 'p_r7q9k2x1...')" },
          },
          required: ["id"],
        },
      },
      {
        name: "stackyup_list_affiliates",
        description: "Retrieves list of active affiliate partners to get their shortcode IDs and default anchor texts.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };

  return NextResponse.json(mcpTools, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    },
  });
}

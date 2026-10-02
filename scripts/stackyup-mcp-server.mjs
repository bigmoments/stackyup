#!/usr/bin/env node
/**
 * StackYup CMS — Custom Model Context Protocol (MCP) Stdio Server
 * Bridges Claude Desktop or any MCP client to the StackYup REST API v1.
 * 
 * Transport: stdio (JSON-RPC 2.0)
 * Environment Variables required:
 *   CMS_API_KEY  - Your secret StackYup API key (e.g. sy_live_...)
 *   CMS_BASE_URL - Base URL of StackYup API v1 (default: https://stackyup.com/api/v1)
 */

import readline from "node:readline";
import fs from "node:fs";
import path from "node:path";

const CMS_API_KEY = process.env.CMS_API_KEY;
const CMS_BASE_URL = (process.env.CMS_BASE_URL || "https://stackyup.com/api/v1").replace(/\/$/, "");

if (!CMS_API_KEY) {
  process.stderr.write("[StackYup MCP] Warning: CMS_API_KEY is not set in environment.\n");
}

const TOOLS = [
  {
    name: "stackyup_upload_media",
    description: "Uploads a human-provided WebP image (<slug>-<n>.webp) to StackYup CMS media storage.",
    inputSchema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "Absolute or relative path to local .webp image file.",
        },
        alt: {
          type: "string",
          description: "Descriptive English alt text for SEO and accessibility (max 255 chars).",
        },
      },
      required: ["file_path", "alt"],
    },
  },
  {
    name: "stackyup_create_draft",
    description: "Creates an article draft or scheduled post with clean semantic HTML, SEO meta, tags, and structured FAQ schema.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Article title (40-70 characters)" },
        slug: { type: "string", description: "URL slug (optional, auto-generated if omitted)" },
        content_html: { type: "string", description: "Clean semantic HTML (p, h2, h3, table, ul, ol, code, pre, no inline styles, no divs)" },
        excerpt: { type: "string", description: "Summary for feed (max 300 chars)" },
        meta_description: { type: "string", description: "SERP meta description strictly 130-160 chars" },
        featured_image_url: { type: "string", description: "CDN image URL from stackyup_upload_media" },
        featured_image_alt: { type: "string", description: "Alt text for featured image" },
        tags: { type: "array", items: { type: "string" }, description: "Tags e.g. ['AI Tools', 'Benchmarks']" },
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
          description: "FAQ pairs for Google FAQPage rich snippets",
        },
        status: { type: "string", enum: ["draft", "scheduled", "published"], default: "draft" },
        published_at: { type: "string", description: "ISO 8601 timestamp (required when status is 'scheduled')" },
        author_name: { type: "string", description: "Optional author persona override. If omitted, falls back to default_author_name in Site Settings." },
      },
      required: ["title", "content_html"],
    },
  },
  {
    name: "stackyup_verify_post",
    description: "Fetches full details of a post by slug or ID to verify formatting and content accuracy.",
    inputSchema: {
      type: "object",
      properties: {
        id_or_slug: { type: "string", description: "Article slug or unique ID (p_...)" },
      },
      required: ["id_or_slug"],
    },
  },
  {
    name: "stackyup_publish_post",
    description: "Promotes an article draft to 'published' status, making it live on the public blog.",
    inputSchema: {
      type: "object",
      properties: {
        post_id: { type: "string", description: "Post ID to publish (p_...)" },
      },
      required: ["post_id"],
    },
  },
  {
    name: "stackyup_list_affiliates",
    description: "Fetches active affiliate partner links, brand names, and shortcode IDs to embed [affiliate id=\"...\"] tags.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

function sendJsonRpc(message) {
  process.stdout.write(JSON.stringify(message) + "\n");
}

async function handleToolCall(name, args) {
  const headers = {
    Authorization: `Bearer ${CMS_API_KEY}`,
  };

  if (name === "stackyup_list_affiliates") {
    const res = await fetch(`${CMS_BASE_URL}/affiliates`, {
      method: "GET",
      headers,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(`List affiliates failed [${res.status}]: ${JSON.stringify(json)}`);
    return json;
  }

  if (name === "stackyup_upload_media") {
    const filePath = path.resolve(args.file_path);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: "image/webp" });
    formData.append("file", blob, fileName);
    if (args.alt) formData.append("alt", args.alt);

    const res = await fetch(`${CMS_BASE_URL}/media`, {
      method: "POST",
      headers,
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(`Upload failed [${res.status}]: ${JSON.stringify(json)}`);
    return json;
  }

  if (name === "stackyup_create_draft") {
    const res = await fetch(`${CMS_BASE_URL}/posts`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
        "Idempotency-Key": `claude-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      },
      body: JSON.stringify(args),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(`Create post failed [${res.status}]: ${JSON.stringify(json)}`);
    return json;
  }

  if (name === "stackyup_verify_post") {
    const target = encodeURIComponent(args.id_or_slug);
    const res = await fetch(`${CMS_BASE_URL}/posts/${target}`, {
      method: "GET",
      headers,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(`Verify post failed [${res.status}]: ${JSON.stringify(json)}`);
    return json;
  }

  if (name === "stackyup_publish_post") {
    const target = encodeURIComponent(args.post_id);
    const res = await fetch(`${CMS_BASE_URL}/posts/${target}`, {
      method: "PATCH",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "published" }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(`Publish post failed [${res.status}]: ${JSON.stringify(json)}`);
    return json;
  }

  throw new Error(`Unknown tool: ${name}`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on("line", async (line) => {
  if (!line.trim()) return;
  let req;
  try {
    req = JSON.parse(line);
  } catch (err) {
    sendJsonRpc({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
    return;
  }

  const { id, method, params } = req;

  // Notification (no id)
  if (id === undefined || id === null) {
    return;
  }

  try {
    if (method === "initialize") {
      sendJsonRpc({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: "stackyup-mcp-bridge",
            version: "1.0.0",
          },
        },
      });
      return;
    }

    if (method === "ping") {
      sendJsonRpc({ jsonrpc: "2.0", id, result: {} });
      return;
    }

    if (method === "tools/list") {
      sendJsonRpc({
        jsonrpc: "2.0",
        id,
        result: {
          tools: TOOLS,
        },
      });
      return;
    }

    if (method === "tools/call") {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      const output = await handleToolCall(toolName, toolArgs);

      sendJsonRpc({
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: typeof output === "string" ? output : JSON.stringify(output, null, 2),
            },
          ],
        },
      });
      return;
    }

    sendJsonRpc({
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    });
  } catch (error) {
    sendJsonRpc({
      jsonrpc: "2.0",
      id,
      result: {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error executing ${params?.name || method}: ${error.message}`,
          },
        ],
      },
    });
  }
});

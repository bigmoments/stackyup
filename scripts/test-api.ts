import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const BASE_URL = process.env.TEST_API_URL || "http://localhost:3000";
const API_KEY = process.env.CMS_API_KEY || "sy_live_0c3f4dc22e7fd9b8ee43d8a0681ad7f179aace26b7bedd54";

async function runLiveHttpTests() {
  console.log("==========================================================");
  console.log(`🌐 LIVE HTTP END-TO-END TEST SUITE: ${BASE_URL}`);
  console.log("==========================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: unknown) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`, detail || "");
      failed++;
    }
  }

  // 1. Live MCP Discovery Endpoint
  console.log("1. Live Test: MCP Protocol Discovery (GET /api/v1/mcp)...");
  try {
    const mcpRes = await fetch(`${BASE_URL}/api/v1/mcp`);
    assert(mcpRes.status === 200, "Live MCP endpoint returns HTTP 200 OK");
    const mcpJson = (await mcpRes.json()) as any;
    assert(mcpJson.protocol_version === "2024-11-05", `MCP protocol version is 2024-11-05 (${mcpJson.protocol_version})`);
    assert(Array.isArray(mcpJson.tools) && mcpJson.tools.length >= 4, `MCP exposes ${mcpJson.tools?.length} tools`);
  } catch (err: any) {
    assert(false, "Live MCP endpoint failed", err.message);
  }

  // 2. Live OpenAPI 3.1 & Agent Spec Discovery
  console.log("\n2. Live Test: Machine Discovery (OpenAPI 3.1 & Agent Spec)...");
  try {
    const openApiRes = await fetch(`${BASE_URL}/api/v1/openapi.json`);
    assert(openApiRes.status === 200, "Live OpenAPI endpoint returns HTTP 200 OK");
    const openApiJson = (await openApiRes.json()) as any;
    assert(openApiJson.openapi === "3.1.0", `Live OpenAPI version is 3.1.0 (${openApiJson.openapi})`);

    const specRes = await fetch(`${BASE_URL}/api/v1/agent-spec.md`);
    assert(specRes.status === 200, "Live Agent Spec markdown returns HTTP 200 OK");
    const specText = await specRes.text();
    assert(specText.includes("Anti-Slop Directive"), "Agent Spec markdown contains editorial directives");
  } catch (err: any) {
    assert(false, "Live machine discovery failed", err.message);
  }

  // 3. Live Security & Auth
  console.log("\n3. Live Test: Security & Authentication...");
  try {
    const unauthRes = await fetch(`${BASE_URL}/api/v1/posts`);
    assert(unauthRes.status === 401, "Rejects request without Bearer token (401)");

    const badKeyRes = await fetch(`${BASE_URL}/api/v1/posts`, {
      headers: { Authorization: "Bearer invalid_key_12345" },
    });
    assert(badKeyRes.status === 401, "Rejects request with invalid Bearer token (401)");

    const authRes = await fetch(`${BASE_URL}/api/v1/posts`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    assert(authRes.status === 200, "Authenticates request with valid Bearer token (200 OK)");
  } catch (err: any) {
    assert(false, "Live security check failed", err.message);
  }

  // 4. Live Media Upload (POST /api/v1/media)
  console.log("\n4. Live Test: Media Upload (POST /api/v1/media)...");
  let uploadedMediaId: string | null = null;
  let uploadedImageUrl: string | null = null;
  try {
    const samplePngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );
    const formData = new FormData();
    const fileBlob = new Blob([samplePngBuffer], { type: "image/png" });
    formData.append("file", fileBlob, "ai-tools-hero.png");
    formData.append("alt", "7 Best AI Tools Infographic");

    const mediaRes = await fetch(`${BASE_URL}/api/v1/media`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
      body: formData,
    });

    const mediaJson = (await mediaRes.json()) as any;
    assert(mediaRes.status === 201, "Media uploaded successfully via HTTP 201");
    assert(Boolean(mediaJson.url), `Media response includes CDN url: ${mediaJson.url}`);
    assert(Boolean(mediaJson.id), `Media response includes ID: ${mediaJson.id}`);
    uploadedMediaId = mediaJson.id;
    uploadedImageUrl = mediaJson.url;
  } catch (err: any) {
    assert(false, "Live media upload failed", err.message);
  }

  // 5. Live Create Article as Draft with Idempotency (POST /api/v1/posts)
  console.log("\n5. Live Test: Article Creation & Idempotency Key...");
  let createdPostId: string | null = null;
  let createdSlug: string | null = null;
  const uniqueKey = `live-idem-${Date.now()}`;
  const testTitle = `Live Automated Agent Benchmark ${Date.now()}`;

  try {
    const postPayload = {
      title: testTitle,
      content_html: "<p>Artificial intelligence is transforming workflows.</p><h2>Top Picks</h2><p>Evaluation details.</p><script>alert('xss')</script>",
      meta_description: "Discover empirical benchmarks for autonomous AI agents in 2026.",
      featured_image_url: uploadedImageUrl,
      featured_image_alt: "Autonomous AI Agent Infographic",
      tags: ["AI Agents", "Benchmarks", "Tech"],
      faq: [
        { question: "What is MCP?", answer: "Model Context Protocol by Anthropic." },
        { question: "Can agents write cleanly?", answer: "Yes, by enforcing Anti-Slop directives." },
      ],
      status: "draft",
      author_name: "Muse AI Publisher",
    };

    // First POST
    const createRes = await fetch(`${BASE_URL}/api/v1/posts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": uniqueKey,
      },
      body: JSON.stringify(postPayload),
    });

    const createJson = (await createRes.json()) as any;
    assert(createRes.status === 201, "Live post created successfully (201 Created)");
    createdPostId = createJson.id || createJson.data?.id;
    createdSlug = createJson.slug || createJson.data?.slug;
    const postStatus = createJson.status || createJson.data?.status;
    assert(postStatus === "draft", `Post initial status is 'draft' (${postStatus})`);
    assert(Boolean(createdPostId), `Created post ID: ${createdPostId}`);

    // Second POST with SAME idempotency key
    const retryRes = await fetch(`${BASE_URL}/api/v1/posts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": uniqueKey,
      },
      body: JSON.stringify(postPayload),
    });
    const retryJson = (await retryRes.json()) as any;
    const retryId = retryJson.id || retryJson.data?.id;
    assert(retryRes.status === 201, "Idempotency returns 201 on repeat");
    assert(retryId === createdPostId, "Idempotency returns identical post ID without creating duplicate");
  } catch (err: any) {
    assert(false, "Live post creation failed", err.message);
  }

  // 6. Live Verify Post & HTML Sanitization (GET /api/v1/posts/:slug)
  console.log("\n6. Live Test: Post Verification & Sanitization (GET /api/v1/posts/:slug)...");
  try {
    if (createdSlug) {
      const getRes = await fetch(`${BASE_URL}/api/v1/posts/${createdSlug}`, {
        headers: { Authorization: `Bearer ${API_KEY}` },
      });
      assert(getRes.status === 200, "Get post by slug returns HTTP 200 OK");
      const getJson = (await getRes.json()) as any;
      const contentHtml = getJson.content_html || getJson.contentHtml || "";
      const tags = getJson.tags || [];
      const faq = getJson.faq || [];
      assert(!contentHtml.includes("<script>"), "HTML Sanitizer successfully stripped malicious <script> tag");
      assert(tags.includes("Benchmarks"), "Tags array saved and returned properly");
      assert(faq.length === 2, `Google FAQPage schema contains 2 items (${faq.length})`);
    }
  } catch (err: any) {
    assert(false, "Live post verification failed", err.message);
  }

  // 7. Live Promote Post to Published (PATCH /api/v1/posts/:id)
  console.log("\n7. Live Test: Atomically Publish Article (PATCH /api/v1/posts/:id)...");
  try {
    if (createdPostId) {
      const patchRes = await fetch(`${BASE_URL}/api/v1/posts/${createdPostId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "published" }),
      });
      assert(patchRes.status === 200, "Patch post status returns HTTP 200 OK");
      const patchJson = (await patchRes.json()) as any;
      const status = patchJson.status || patchJson.data?.status;
      const publishedAt = patchJson.published_at || patchJson.publishedAt || patchJson.data?.published_at;
      assert(status === "published", `Post status successfully promoted to 'published' (${status})`);
      assert(Boolean(publishedAt), `published_at timestamp populated: ${publishedAt}`);
    }
  } catch (err: any) {
    assert(false, "Live patch failed", err.message);
  }

  // 8. Live Query Published Feed
  console.log("\n8. Live Test: Query Filtered Feed (GET /api/v1/posts?status=published)...");
  try {
    const listRes = await fetch(`${BASE_URL}/api/v1/posts?status=published`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    assert(listRes.status === 200, "List published posts returns HTTP 200 OK");
    const listJson = (await listRes.json()) as any;
    const items = listJson.items || listJson.data?.items || [];
    assert(items.length >= 1, `Published feed returns ${items.length} items`);
  } catch (err: any) {
    assert(false, "Live feed query failed", err.message);
  }

  // 9. Live AI Writer Generation (POST /api/admin/ai-write)
  console.log("\n9. Live Test: AI Writer Generation (/api/admin/ai-write)...");
  try {
    const aiWriteRes = await fetch(`${BASE_URL}/api/admin/ai-write`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: "Production LLM Routing Patterns",
        category: "Tech",
        persona: "hermes",
        save_to_db: false,
      }),
    });
    assert(aiWriteRes.status === 200, "Live AI Writer endpoint returns HTTP 200 OK");
    const aiWriteJson = (await aiWriteRes.json()) as any;
    const content = aiWriteJson.contentHtml || aiWriteJson.content_html || "";
    assert(content.includes("<table"), "AI Writer generated comparison table for Hermes persona");
    assert(aiWriteJson.authorName === "Hermes AI Benchmark", "AI Writer sets Hermes author name");
  } catch (err: any) {
    assert(false, "Live AI writer failed", err.message);
  }

  // 10. Clean up test records
  console.log("\n10. Cleaning up live test post...");
  try {
    if (createdPostId) {
      const deleteRes = await fetch(`${BASE_URL}/api/v1/posts/${createdPostId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${API_KEY}` },
      });
      assert(deleteRes.status === 200, `Deleted live test post ${createdPostId}`);
    }
  } catch (err: any) {
    assert(false, "Post cleanup failed", err.message);
  }

  console.log(`\n==========================================================`);
  console.log(`LIVE HTTP TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log(`==========================================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runLiveHttpTests().catch((err) => {
  console.error("Live test execution fatal error:", err);
  process.exit(1);
});

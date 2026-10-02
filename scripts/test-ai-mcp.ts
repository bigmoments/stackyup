import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { nanoid } from "nanoid";
import { eq, desc } from "drizzle-orm";
import { NextRequest } from "next/server";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { db, schema } from "../src/db";
import { hashApiKey } from "../src/lib/auth";

// Import Route Handlers directly
import { GET as getMcpRoute } from "../src/app/api/v1/mcp/route";
import { GET as getOpenApiRoute } from "../src/app/api/v1/openapi.json/route";
import { GET as getAgentSpecRoute } from "../src/app/api/v1/agent-spec.md/route";
import { POST as createPostRoute, GET as listPostsRoute } from "../src/app/api/v1/posts/route";
import { GET as getPostRoute, PATCH as patchPostRoute, DELETE as deletePostRoute } from "../src/app/api/v1/posts/[id]/route";
import { POST as aiWriteRoute } from "../src/app/api/admin/ai-write/route";

async function runAiAndMcpTests() {
  console.log("==========================================================");
  console.log("🤖 STACKYUP CMS: AI AGENT & MCP PROTOCOL TEST SUITE");
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

  const masterApiKey = process.env.CMS_API_KEY || "sy_live_0c3f4dc22e7fd9b8ee43d8a0681ad7f179aace26b7bedd54";

  // ========================================================
  // 1. MCP (Model Context Protocol) Server Protocol Tests
  // ========================================================
  console.log("1. Testing MCP Server Protocol Specification (GET /api/v1/mcp)...");
  try {
    const mcpReq = new Request("http://localhost:3000/api/v1/mcp");
    const mcpRes = await getMcpRoute(mcpReq);
    assert(mcpRes.status === 200, "MCP endpoint returns HTTP 200 OK");

    const mcpJson = await mcpRes.json();
    assert(mcpJson.protocol_version === "2024-11-05", `MCP protocol version matches spec (2024-11-05): '${mcpJson.protocol_version}'`);
    assert(mcpJson.server?.name === "stackyup-cms-publisher", `MCP server name is valid: '${mcpJson.server?.name}'`);
    assert(Array.isArray(mcpJson.tools), "MCP response includes tools array");

    const toolNames = mcpJson.tools.map((t: any) => t.name);
    assert(toolNames.includes("stackyup_upload_media"), "MCP tool 'stackyup_upload_media' is registered");
    assert(toolNames.includes("stackyup_create_draft"), "MCP tool 'stackyup_create_draft' is registered");
    assert(toolNames.includes("stackyup_verify_post"), "MCP tool 'stackyup_verify_post' is registered");
    assert(toolNames.includes("stackyup_publish_post"), "MCP tool 'stackyup_publish_post' is registered");

    // Validate create_draft inputSchema
    const draftTool = mcpJson.tools.find((t: any) => t.name === "stackyup_create_draft");
    assert(draftTool?.inputSchema?.type === "object", "stackyup_create_draft has object inputSchema");
    assert(draftTool?.inputSchema?.required?.includes("title"), "stackyup_create_draft requires 'title'");
    assert(draftTool?.inputSchema?.required?.includes("content_html"), "stackyup_create_draft requires 'content_html'");
    assert(Boolean(draftTool?.inputSchema?.properties?.faq), "stackyup_create_draft supports Google FAQPage schema");
  } catch (err: any) {
    assert(false, "MCP endpoint execution failed", err.message);
  }

  // ========================================================
  // 2. Machine Discovery Contracts (OpenAPI & Agent Markdown Spec)
  // ========================================================
  console.log("\n2. Testing Machine Discovery Endpoints (OpenAPI 3.1 & Agent Spec)...");
  try {
    // OpenAPI 3.1
    const openApiReq = new Request("http://localhost:3000/api/v1/openapi.json");
    const openApiRes = await getOpenApiRoute(openApiReq);
    assert(openApiRes.status === 200, "OpenAPI 3.1 endpoint returns HTTP 200 OK");

    const openApiJson = await openApiRes.json();
    assert(openApiJson.openapi === "3.1.0", `OpenAPI version is 3.1.0: '${openApiJson.openapi}'`);
    assert(Boolean(openApiJson.paths?.["/posts"]), "OpenAPI defines path /posts");
    assert(Boolean(openApiJson.paths?.["/media"]), "OpenAPI defines path /media");
    assert(Boolean(openApiJson.paths?.["/posts/{id_or_slug}"]), "OpenAPI defines path /posts/{id_or_slug}");
    assert(Boolean(openApiJson.components?.securitySchemes?.ApiKeyAuth), "OpenAPI defines ApiKeyAuth security scheme");

    // Agent Markdown Spec
    const specReq = new NextRequest("http://localhost:3000/api/v1/agent-spec.md");
    const specRes = await getAgentSpecRoute(specReq);
    assert(specRes.status === 200, "Agent spec markdown returns HTTP 200 OK");
    const specText = await specRes.text();
    assert(specText.includes("Anti-Slop Directive"), "Agent spec contains Anti-Slop Directive");
    assert(specText.includes("stackyup_create_draft"), "Agent spec contains tool definitions");
  } catch (err: any) {
    assert(false, "Machine discovery endpoints failed", err.message);
  }

  // ========================================================
  // 3. AI Agent Authentication & Security Checks
  // ========================================================
  console.log("\n3. Testing AI Agent Authentication & Key Validation...");
  try {
    // Unauthenticated request
    const unauthReq = new NextRequest("http://localhost:3000/api/v1/posts");
    const unauthRes = await listPostsRoute(unauthReq);
    assert(unauthRes.status === 401, "Rejects request without Authorization header (401)");

    // Bad token request
    const badKeyReq = new NextRequest("http://localhost:3000/api/v1/posts", {
      headers: { Authorization: "Bearer bad_secret_key_999" },
    });
    const badKeyRes = await listPostsRoute(badKeyReq);
    assert(badKeyRes.status === 401, "Rejects invalid Bearer key (401)");

    // Master API Key request
    const masterReq = new NextRequest("http://localhost:3000/api/v1/posts", {
      headers: { Authorization: `Bearer ${masterApiKey}` },
    });
    const masterRes = await listPostsRoute(masterReq);
    assert(masterRes.status === 200, "Authenticates with master CMS_API_KEY (200 OK)");

    // Database Generated Agent API Key Lifecycle
    const testRawKey = `sy_agent_test_${nanoid(32)}`;
    const testKeyHash = hashApiKey(testRawKey);
    const testKeyId = `k_agent_${nanoid(12)}`;

    await db.insert(schema.apiKeys).values({
      id: testKeyId,
      name: "Hermes Autonomous Agent Test Key",
      keyHash: testKeyHash,
      keyPrefix: testRawKey.slice(0, 14),
      isActive: true,
    });

    const agentKeyReq = new NextRequest("http://localhost:3000/api/v1/posts", {
      headers: { Authorization: `Bearer ${testRawKey}` },
    });
    const agentKeyRes = await listPostsRoute(agentKeyReq);
    assert(agentKeyRes.status === 200, "Authenticates with DB-stored agent API key (200 OK)");

    // Revoke key and test rejection (should return 403 FORBIDDEN or 401)
    await db.update(schema.apiKeys).set({ isActive: false }).where(eq(schema.apiKeys.id, testKeyId));
    const revokedKeyReq = new NextRequest("http://localhost:3000/api/v1/posts", {
      headers: { Authorization: `Bearer ${testRawKey}` },
    });
    const revokedKeyRes = await listPostsRoute(revokedKeyReq);
    assert(
      revokedKeyRes.status === 403 || revokedKeyRes.status === 401,
      `Rejects revoked agent API key safely (Status: ${revokedKeyRes.status})`
    );

    // Clean up key
    await db.delete(schema.apiKeys).where(eq(schema.apiKeys.id, testKeyId));
    assert(true, "Cleaned up temporary agent API key");
  } catch (err: any) {
    assert(false, "Authentication test failed", err.message);
  }

  // ========================================================
  // 4. Idempotency Key Protection for Autonomous Retry Loops
  // ========================================================
  console.log("\n4. Testing Idempotency Protection (Idempotency-Key Header)...");
  const uniqueIdempotencyKey = `agent-idemp-${nanoid(16)}`;
  const testTitle = `AI Agent Benchmark Run ${Date.now()}`;
  let createdPostId: string | null = null;
  let testSlug: string | null = null;

  try {
    const postPayload = {
      title: testTitle,
      content_html: "<h2>Empirical Results</h2><p>Zero-slop benchmark data for autonomous systems.</p>",
      excerpt: "Evaluating AI agent latency and token metrics.",
      meta_description: "Real-world test of AI agent integration and publication protocol.",
      tags: ["AI Agents", "Benchmarks"],
      faq: [
        { question: "What is MCP?", answer: "Model Context Protocol for standardized agent tool calling." },
        { question: "How does idempotency help?", answer: "Prevents duplicate articles on agent network retries." },
      ],
      status: "draft",
      author_name: "Muse AI Agent",
    };

    // First attempt
    const req1 = new NextRequest("http://localhost:3000/api/v1/posts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${masterApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": uniqueIdempotencyKey,
      },
      body: JSON.stringify(postPayload),
    });
    const res1 = await createPostRoute(req1);
    assert(res1.status === 201, "First submission with idempotency key succeeds (201 Created)");
    const data1 = await res1.json();
    createdPostId = data1.id || data1.data?.id;
    testSlug = data1.slug || data1.data?.slug;
    assert(Boolean(createdPostId), `Created post ID: ${createdPostId}`);

    // Second attempt with SAME idempotency key (simulating network retry)
    const req2 = new NextRequest("http://localhost:3000/api/v1/posts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${masterApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": uniqueIdempotencyKey,
      },
      body: JSON.stringify(postPayload),
    });
    const res2 = await createPostRoute(req2);
    assert(res2.status === 201, "Second submission returns cached response (201)");
    const data2 = await res2.json();
    const secondPostId = data2.id || data2.data?.id;
    assert(secondPostId === createdPostId, "Idempotency prevents duplicate post creation in DB");
  } catch (err: any) {
    assert(false, "Idempotency test failed", err.message);
  }

  // ========================================================
  // 5. Autonomous Publishing Pipeline (Verify -> Patch -> Live)
  // ========================================================
  console.log("\n5. Testing Autonomous Ingestion & Promotion Pipeline...");
  try {
    if (createdPostId && testSlug) {
      // Step A: Agent verifies post by slug (stackyup_verify_post)
      const verifyReq = new NextRequest(`http://localhost:3000/api/v1/posts/${testSlug}`, {
        headers: { Authorization: `Bearer ${masterApiKey}` },
      });
      const verifyRes = await getPostRoute(verifyReq, { params: Promise.resolve({ id: testSlug }) });
      assert(verifyRes.status === 200, "Agent can verify post by slug (GET /api/v1/posts/:slug)");
      const verifyData = await verifyRes.json();
      const postStatus = verifyData.status ?? verifyData.data?.status;
      const postFaq = verifyData.faq ?? verifyData.data?.faq;
      assert(postStatus === "draft", `Verified post initial status is 'draft' (Found: '${postStatus}')`);
      assert(Array.isArray(postFaq) && postFaq.length === 2, "Verified post contains 2 Google FAQPage items");

      // Step B: Agent promotes post to 'published' (stackyup_publish_post)
      const publishReq = new NextRequest(`http://localhost:3000/api/v1/posts/${createdPostId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${masterApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "published" }),
      });
      const publishRes = await patchPostRoute(publishReq, { params: Promise.resolve({ id: createdPostId }) });
      assert(publishRes.status === 200, "Agent publishes draft atomically (PATCH /api/v1/posts/:id)");
      const publishData = await publishRes.json();
      const pubStatus = publishData.status ?? publishData.data?.status;
      const pubAt = publishData.published_at ?? publishData.data?.published_at;
      assert(pubStatus === "published", `Post status updated to 'published' (Found: '${pubStatus}')`);
      assert(Boolean(pubAt), "Post has valid published_at ISO timestamp");

      // Step C: Clean up test post
      const deleteReq = new NextRequest(`http://localhost:3000/api/v1/posts/${createdPostId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${masterApiKey}` },
      });
      const deleteRes = await deletePostRoute(deleteReq, { params: Promise.resolve({ id: createdPostId }) });
      assert(deleteRes.status === 204 || deleteRes.status === 200, "Cleaned up test post from DB");
    }
  } catch (err: any) {
    assert(false, "Autonomous pipeline test failed", err.message);
  }

  // ========================================================
  // 6. AI Content Generator & Tone Governance (/api/admin/ai-write)
  // ========================================================
  console.log("\n6. Testing AI Content Generator & Editorial Personas (/api/admin/ai-write)...");
  try {
    // Test Persona 1: Muse (Editorial)
    const museReq = new NextRequest("http://localhost:3000/api/admin/ai-write", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${masterApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: "Model Context Protocol in Enterprise Architecture",
        category: "AI Tools",
        persona: "muse",
        save_to_db: false,
      }),
    });
    const museRes = await aiWriteRoute(museReq);
    assert(museRes.status === 200, "AI Writer generates Muse editorial draft (200 OK)");
    const museJson = await museRes.json();
    const museArticleHtml = museJson.contentHtml || museJson.content_html || museJson.data?.article?.content_html;
    const museFaq = museJson.faq || museJson.data?.article?.faq;
    assert(Boolean(museArticleHtml), "Generated article contains contentHtml");
    assert(museArticleHtml?.includes("<table"), "Generated article includes structured comparison table");
    assert(Array.isArray(museFaq) && museFaq.length >= 2, "Generated article includes structured FAQ items");

    // Test Persona 2: Hermes (Benchmark / Technical)
    const hermesReq = new NextRequest("http://localhost:3000/api/admin/ai-write", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${masterApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: "vLLM vs Ollama Inference Speed",
        category: "Benchmarks",
        persona: "hermes",
        save_to_db: false,
      }),
    });
    const hermesRes = await aiWriteRoute(hermesReq);
    assert(hermesRes.status === 200, "AI Writer generates Hermes benchmark draft (200 OK)");
    const hermesJson = await hermesRes.json();
    const hermesAuthor = hermesJson.authorName || hermesJson.author_name || hermesJson.data?.article?.author_name;
    assert(hermesAuthor === "Hermes AI Benchmark", "Hermes persona sets author_name correctly");
  } catch (err: any) {
    assert(false, "AI Content Generator test failed", err.message);
  }

  // ========================================================
  // 7. Autonomous Governance Settings Persistence
  // ========================================================
  console.log("\n7. Testing Agent Governance Settings Persistence in site_settings...");
  try {
    const testSettings = [
      { key: "agent_auto_publish", value: "false" },
      { key: "agent_anti_slop_strict", value: "true" },
      { key: "agent_default_author", value: "StackYup AI Engine" },
    ];

    for (const setting of testSettings) {
      await db
        .insert(schema.siteSettings)
        .values({
          key: setting.key,
          value: setting.value,
        })
        .onConflictDoUpdate({
          target: schema.siteSettings.key,
          set: { value: setting.value },
        });
    }

    const fetched = await db
      .select()
      .from(schema.siteSettings)
      .where(eq(schema.siteSettings.key, "agent_anti_slop_strict"));
    assert(fetched[0]?.value === "true", "Agent governance settings persisted and retrievable");
  } catch (err: any) {
    assert(false, "Governance settings persistence test failed", err.message);
  }

  // ========================================================
  // Summary
  // ========================================================
  console.log("\n==========================================================");
  console.log(`AI & MCP TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log("==========================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAiAndMcpTests().catch((err) => {
  console.error("FATAL ERROR in AI/MCP test runner:", err);
  process.exit(1);
});

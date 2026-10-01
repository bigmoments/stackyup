import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const BASE_URL = process.env.TEST_API_URL || "http://localhost:3000";
const API_KEY = process.env.CMS_API_KEY;

if (!API_KEY) {
  console.error("Error: CMS_API_KEY is not defined in .env.local");
  process.exit(1);
}

async function runTests() {
  console.log(`Starting StackYup Publishing API Test Suite against: ${BASE_URL}\n`);
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: unknown) {
    if (condition) {
      console.log(`✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${testName}`, detail || "");
      failed++;
    }
  }

  // 1. Test Unauthorized Request
  console.log("--- Test 1: Security & Auth ---");
  const unauthRes = await fetch(`${BASE_URL}/api/v1/posts`, {
    method: "GET",
  });
  assert(unauthRes.status === 401, "Rejects request without Bearer token (401)");

  const badKeyRes = await fetch(`${BASE_URL}/api/v1/posts`, {
    method: "GET",
    headers: { Authorization: "Bearer invalid_key_12345" },
  });
  assert(badKeyRes.status === 401, "Rejects request with invalid Bearer token (401)");

  // 2. Test Media Upload (POST /api/v1/media)
  console.log("\n--- Test 2: Media Upload ---");
  // Create a dummy image file buffer
  const sampleImagePath = path.resolve(process.cwd(), "sample-test.png");
  // Simple 1x1 transparent PNG buffer
  const samplePngBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );
  fs.writeFileSync(sampleImagePath, samplePngBuffer);

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
  assert(mediaRes.status === 201, "Media uploaded successfully (201)", mediaJson);
  assert(Boolean(mediaJson.url), "Media response includes url", mediaJson.url);
  assert(Boolean(mediaJson.id), "Media response includes id", mediaJson.id);

  // Clean up sample file
  if (fs.existsSync(sampleImagePath)) {
    fs.unlinkSync(sampleImagePath);
  }

  const uploadedImageUrl = mediaJson.url;

  // 3. Test Create Article as Draft (POST /api/v1/posts)
  console.log("\n--- Test 3: Create Post (Draft) ---");
  const idempotencyKey = `test-idem-${Date.now()}`;
  const postPayload = {
    title: "7 Best AI Tools for Freelancers in 2026",
    content_html: "<p>Artificial intelligence is transforming freelance workflows.</p><h2>Top Picks</h2><p>Here are the details...</p><script>alert('xss')</script>",
    meta_description: "Discover the 7 best AI tools for freelancers in 2026.",
    featured_image_url: uploadedImageUrl,
    featured_image_alt: "7 Best AI Tools Infographic",
    tags: ["AI Tools", "Freelancers", "Reviews"],
    faq: [
      { question: "What is the best overall AI tool?", answer: "Tool X is the most versatile." },
      { question: "Is there a free plan?", answer: "Yes, free tiers are available." },
    ],
    status: "draft",
  };

  const createPostRes = await fetch(`${BASE_URL}/api/v1/posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(postPayload),
  });

  const createPostJson = (await createPostRes.json()) as any;
  assert(createPostRes.status === 201, "Post created successfully (201)", createPostJson);
  assert(createPostJson.status === "draft", "Post status is draft", createPostJson.status);
  assert(createPostJson.slug === "7-best-ai-tools-for-freelancers-in-2026", "Slug auto-generated properly", createPostJson.slug);

  const createdPostId = createPostJson.id;
  const createdSlug = createPostJson.slug;

  // 4. Test Idempotency (Repeat exact same request)
  console.log("\n--- Test 4: Idempotency Key ---");
  const retryPostRes = await fetch(`${BASE_URL}/api/v1/posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(postPayload),
  });
  const retryPostJson = (await retryPostRes.json()) as any;
  assert(retryPostRes.status === 201, "Idempotency returns 201 on repeat");
  assert(retryPostJson.id === createdPostId, "Idempotency returns identical post ID without creating duplicate");

  // 5. Test Get Post Details and verify HTML Sanitization (GET /api/v1/posts/:slug)
  console.log("\n--- Test 5: Get Post Detail & HTML Sanitization ---");
  const getPostRes = await fetch(`${BASE_URL}/api/v1/posts/${createdSlug}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  const getPostJson = (await getPostRes.json()) as any;
  assert(getPostRes.status === 200, "Get post by slug returns 200");
  assert(!getPostJson.contentHtml.includes("<script>"), "HTML Sanitizer stripped malicious <script> tag");
  assert(getPostJson.tags?.includes("Freelancers"), "Tags JSON array saved and parsed correctly");

  // 6. Test Publish Post (PATCH /api/v1/posts/:id)
  console.log("\n--- Test 6: Publish Post (PATCH) ---");
  const patchRes = await fetch(`${BASE_URL}/api/v1/posts/${createdPostId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status: "published",
    }),
  });
  const patchJson = (await patchRes.json()) as any;
  assert(patchRes.status === 200, "Patch post status to published returns 200", patchJson);
  assert(patchJson.status === "published", "Post status updated to published", patchJson.status);
  assert(Boolean(patchJson.publishedAt), "publishedAt timestamp automatically populated on publish");

  // 7. Test List Posts with Status Filter (GET /api/v1/posts?status=published)
  console.log("\n--- Test 7: List Filtered Posts ---");
  const listRes = await fetch(`${BASE_URL}/api/v1/posts?status=published`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  const listJson = (await listRes.json()) as any;
  assert(listRes.status === 200, "List posts returns 200");
  assert(listJson.items.length >= 1, "List contains published post");
  assert(listJson.pagination.total >= 1, "Pagination total count accurate");

  // 8. Test Static Pages API (POST & PATCH /api/v1/pages)
  console.log("\n--- Test 8: Static Pages API ---");
  const createPageRes = await fetch(`${BASE_URL}/api/v1/pages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: "Privacy Policy",
      content_html: "<p>We value your privacy.</p>",
      meta_description: "StackYup Privacy Policy and Data Practices.",
      status: "published",
    }),
  });
  const createPageJson = (await createPageRes.json()) as any;
  assert(createPageRes.status === 201, "Page created successfully (201)", createPageJson);
  assert(createPageJson.slug === "privacy-policy", "Page slug auto-generated properly");

  console.log(`\n==================================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`==================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});

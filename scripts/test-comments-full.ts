import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { nanoid } from "nanoid";
import { eq, desc, and } from "drizzle-orm";
import { NextRequest } from "next/server";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { db, schema } from "../src/db";
import { signToken } from "../src/lib/admin-session";

// Import comment route handlers
import { GET as getPublicComments, POST as postPublicComment } from "../src/app/api/v1/posts/[id]/comments/route";
import { PATCH as patchAdminComment, DELETE as deleteAdminComment } from "../src/app/api/admin/comments/[id]/route";
import { GET as getAdminComments } from "../src/app/api/admin/comments/route";

async function runCommentTests() {
  console.log("==========================================================");
  console.log("💬 STACKYUP CMS: COMPREHENSIVE COMMENT SYSTEM TEST SUITE");
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

  // 1. Pick a real article from DB to test commenting against
  const posts = await db.select().from(schema.posts).where(eq(schema.posts.status, "published")).limit(1);
  if (posts.length === 0) {
    console.error("No published post available for comment test.");
    process.exit(1);
  }
  const testPost = posts[0];
  console.log(`Target Article for Comment Tests: "${testPost.title}" (${testPost.id})\n`);

  const adminSessionCookie = `sy_admin_session=${signToken({
    email: "admin@stackyup.com",
    iat: Date.now(),
    exp: Date.now() + 3600000,
  })}`;

  let createdCommentId: string | null = null;

  // ========================================================
  // 1. Testing Reader Comment Submission (POST /api/v1/posts/:id/comments)
  // ========================================================
  console.log("1. Testing Public Reader Comment Submission...");
  try {
    // A. Validation: Reject empty comment
    const emptyReq = new NextRequest(`http://localhost:3000/api/v1/posts/${testPost.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorName: "Tester", content: "" }),
    });
    const emptyRes = await postPublicComment(emptyReq, { params: Promise.resolve({ id: testPost.id }) });
    assert(emptyRes.status === 400, "Rejects empty comment with 400 Bad Request");

    // B. Successful submission with XSS sanitization and post title resolution
    const commentPayload = {
      authorName: "Dr. Evelyn Reed",
      authorEmail: "evelyn@reed-labs.org",
      content: "Excellent benchmark analysis. <script>alert('malicious')</script>How does vLLM paged attention compare in multi-node setups?",
    };

    const submitReq = new NextRequest(`http://localhost:3000/api/v1/posts/${testPost.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(commentPayload),
    });
    const submitRes = await postPublicComment(submitReq, { params: Promise.resolve({ id: testPost.id }) });
    assert(submitRes.status === 200, "Reader comment submitted successfully (200 OK)");

    const submitJson = await submitRes.json();
    createdCommentId = submitJson.data?.id;
    assert(Boolean(createdCommentId), `Comment created with ID: ${createdCommentId}`);
    assert(submitJson.data?.postTitle === testPost.title, `Post title resolved correctly: '${submitJson.data?.postTitle}'`);
    assert(!submitJson.data?.content?.includes("<script>"), "HTML script tag was stripped from content");
    assert(submitJson.data?.status === "approved", "New comment default status is 'approved'");
  } catch (err: any) {
    assert(false, "Comment submission failed", err.message);
  }

  // ========================================================
  // 2. Testing Public Comments Retrieval (GET /api/v1/posts/:id/comments)
  // ========================================================
  console.log("\n2. Testing Public Comments Retrieval...");
  try {
    const getReq = new NextRequest(`http://localhost:3000/api/v1/posts/${testPost.slug}/comments`);
    const getRes = await getPublicComments(getReq, { params: Promise.resolve({ id: testPost.slug }) });
    assert(getRes.status === 200, "Public reader can query comments via slug (200 OK)");

    const getJson = await getRes.json();
    const commentMatch = getJson.data?.find((c: any) => c.id === createdCommentId);
    assert(Boolean(commentMatch), "Newly submitted comment is visible in public article feed");
    assert(commentMatch?.authorName === "Dr. Evelyn Reed", "Author name matches submission");
  } catch (err: any) {
    assert(false, "Public comments query failed", err.message);
  }

  // ========================================================
  // 3. Testing Admin Moderation Status Transitions
  // ========================================================
  console.log("\n3. Testing Admin Moderation Status Transitions...");
  try {
    if (createdCommentId) {
      // Step A: Admin sets status to 'pending'
      const pendingReq = new NextRequest(`http://localhost:3000/api/admin/comments/${createdCommentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: adminSessionCookie },
        body: JSON.stringify({ status: "pending" }),
      });
      const pendingRes = await patchAdminComment(pendingReq, { params: Promise.resolve({ id: createdCommentId }) });
      assert(pendingRes.status === 200, "Admin changes comment status to 'pending'");

      // Verify that public query NO LONGER returns this comment
      const verifyReq = new NextRequest(`http://localhost:3000/api/v1/posts/${testPost.id}/comments`);
      const verifyRes = await getPublicComments(verifyReq, { params: Promise.resolve({ id: testPost.id }) });
      const verifyJson = await verifyRes.json();
      const isStillPublic = verifyJson.data?.some((c: any) => c.id === createdCommentId);
      assert(!isStillPublic, "Pending comment is properly hidden from public reader view");

      // Step B: Admin marks as 'spam'
      const spamReq = new NextRequest(`http://localhost:3000/api/admin/comments/${createdCommentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: adminSessionCookie },
        body: JSON.stringify({ status: "spam" }),
      });
      const spamRes = await patchAdminComment(spamReq, { params: Promise.resolve({ id: createdCommentId }) });
      assert(spamRes.status === 200, "Admin marks comment as 'spam'");

      // Step C: Admin moves to 'trash'
      const trashReq = new NextRequest(`http://localhost:3000/api/admin/comments/${createdCommentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: adminSessionCookie },
        body: JSON.stringify({ status: "trash" }),
      });
      const trashRes = await patchAdminComment(trashReq, { params: Promise.resolve({ id: createdCommentId }) });
      assert(trashRes.status === 200, "Admin moves comment to 'trash'");

      // Step D: Admin restores comment back to 'approved'
      const restoreReq = new NextRequest(`http://localhost:3000/api/admin/comments/${createdCommentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: adminSessionCookie },
        body: JSON.stringify({ status: "approved" }),
      });
      const restoreRes = await patchAdminComment(restoreReq, { params: Promise.resolve({ id: createdCommentId }) });
      assert(restoreRes.status === 200, "Admin restores comment to 'approved'");

      // Verify it appears again in public reader query
      const restoreVerifyRes = await getPublicComments(verifyReq, { params: Promise.resolve({ id: testPost.id }) });
      const restoreJson = await restoreVerifyRes.json();
      const isPublicAgain = restoreJson.data?.some((c: any) => c.id === createdCommentId);
      assert(isPublicAgain, "Restored comment is immediately visible to public readers again");
    }
  } catch (err: any) {
    assert(false, "Moderation transitions failed", err.message);
  }

  // ========================================================
  // 4. Testing Admin Comments Moderation List & Filter
  // ========================================================
  console.log("\n4. Testing Admin Comments Moderation Query...");
  try {
    const listReq = new NextRequest("http://localhost:3000/api/admin/comments", {
      headers: { Cookie: adminSessionCookie },
    });
    const listRes = await getAdminComments(listReq);
    assert(listRes.status === 200, "Admin comments API returns HTTP 200 OK");
    const listJson = await listRes.json();
    assert(Array.isArray(listJson.data?.comments || listJson.comments), "Admin comments response includes comments array");
  } catch (err: any) {
    assert(false, "Admin comments query failed", err.message);
  }

  // ========================================================
  // 5. Testing Permanent Comment Deletion
  // ========================================================
  console.log("\n5. Testing Permanent Comment Deletion...");
  try {
    if (createdCommentId) {
      const delReq = new NextRequest(`http://localhost:3000/api/admin/comments/${createdCommentId}`, {
        method: "DELETE",
        headers: { Cookie: adminSessionCookie },
      });
      const delRes = await deleteAdminComment(delReq, { params: Promise.resolve({ id: createdCommentId }) });
      assert(delRes.status === 200, "Admin deletes comment permanently (200 OK)");

      // Check DB directly
      const dbCheck = await db.select().from(schema.comments).where(eq(schema.comments.id, createdCommentId));
      assert(dbCheck.length === 0, "Comment is completely removed from database");
    }
  } catch (err: any) {
    assert(false, "Comment deletion failed", err.message);
  }

  console.log("\n==========================================================");
  console.log(`COMMENT SYSTEM TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log("==========================================================");

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runCommentTests().catch((err) => {
  console.error("FATAL ERROR in comment test runner:", err);
  process.exit(1);
});

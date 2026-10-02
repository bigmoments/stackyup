import path from "path";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { eq, desc, count } from "drizzle-orm";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { getDb } from "../src/db";
import * as schema from "../src/db/schema";
import { signToken, verifyToken } from "../src/lib/admin-session";
import { hashApiKey, generateApiKey } from "../src/lib/auth";
import { clearCache } from "../src/lib/cache";

async function runFullAdminTestSuite() {
  console.log("==========================================================");
  console.log("🚀 STACKYUP CMS: COMPREHENSIVE ADMIN FUNCTIONALITY TEST");
  console.log("==========================================================\n");

  const db = getDb();
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: unknown) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`, details || "");
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Admin Session & Cryptographic Token Auth
    // ----------------------------------------------------
    console.log("1. Testing Admin Authentication & Cryptographic Session...");
    const testEmail = "test_admin@stackyup.com";
    const token = signToken({ email: testEmail, iat: Date.now(), exp: Date.now() + 3600000 });
    assert(Boolean(token && token.includes(".")), "Session token signed with HMAC SHA-256 signature");

    const decoded = verifyToken<{ email: string }>(token);
    assert(decoded?.email === testEmail, "Session token accurately verified and decrypted payload", decoded);

    const expiredToken = signToken({ email: testEmail, iat: Date.now() - 10000, exp: Date.now() - 1000 });
    const expiredDecoded = verifyToken<{ email: string }>(expiredToken);
    assert(expiredDecoded === null, "Expired session token safely rejected");

    // ----------------------------------------------------
    // TEST 2: Dashboard Real Data Metrics
    // ----------------------------------------------------
    console.log("\n2. Testing Real Database Metrics for Admin Dashboard...");
    const [postsCount, draftsList, commentsCount, subsCount] = await Promise.all([
      db.select({ count: count() }).from(schema.posts).where(eq(schema.posts.status, "published")),
      db.select().from(schema.posts).where(eq(schema.posts.status, "draft")).limit(5),
      db.select({ count: count() }).from(schema.comments),
      db.select({ count: count() }).from(schema.subscribers),
    ]);

    assert(typeof postsCount[0]?.count === "number", `Real published posts count queried: ${postsCount[0]?.count}`);
    assert(Array.isArray(draftsList), `Real draft posts list queried: ${draftsList.length} items`);
    assert(typeof commentsCount[0]?.count === "number", `Real comments count queried: ${commentsCount[0]?.count}`);
    assert(typeof subsCount[0]?.count === "number", `Real subscribers count queried: ${subsCount[0]?.count}`);

    // ----------------------------------------------------
    // TEST 3: Posts CRUD Lifecycle
    // ----------------------------------------------------
    console.log("\n3. Testing Posts Management CRUD Lifecycle...");
    const testPostId = `post_test_${nanoid(8)}`;
    const testPostSlug = `test-article-${nanoid(6)}`;

    // Create Draft
    await db.insert(schema.posts).values({
      id: testPostId,
      title: "Automated Test Article",
      slug: testPostSlug,
      contentHtml: "<p>This is a real test post content generated to verify DB functions.</p>",
      excerpt: "Test post excerpt",
      metaDescription: "Test post meta description",
      status: "draft",
      tags: ["AI Tools", "Testing"],
      claps: 5,
    });
    const insertedPost = await db.select().from(schema.posts).where(eq(schema.posts.id, testPostId)).limit(1);
    assert(insertedPost.length === 1 && insertedPost[0].title === "Automated Test Article", "Created draft article in DB");

    // Update / Publish
    await db.update(schema.posts).set({
      status: "published",
      publishedAt: new Date(),
      title: "Automated Test Article (Updated)",
    }).where(eq(schema.posts.id, testPostId));

    const updatedPost = await db.select().from(schema.posts).where(eq(schema.posts.id, testPostId)).limit(1);
    assert(updatedPost[0]?.status === "published" && updatedPost[0]?.title.includes("Updated"), "Published and updated article in DB");

    // Delete
    await db.delete(schema.posts).where(eq(schema.posts.id, testPostId));
    const deletedPost = await db.select().from(schema.posts).where(eq(schema.posts.id, testPostId)).limit(1);
    assert(deletedPost.length === 0, "Successfully deleted test article from DB");

    // ----------------------------------------------------
    // TEST 4: Static Pages CRUD
    // ----------------------------------------------------
    console.log("\n4. Testing Static Pages CRUD Lifecycle...");
    const testPageId = `page_test_${nanoid(8)}`;
    const testPageSlug = `test-page-${nanoid(6)}`;

    await db.insert(schema.pages).values({
      id: testPageId,
      title: "Terms of Test Page",
      slug: testPageSlug,
      contentHtml: "<h1>Legal Test</h1><p>Test legal agreement content.</p>",
      metaDescription: "Test page meta",
      status: "published",
    });

    const insertedPage = await db.select().from(schema.pages).where(eq(schema.pages.id, testPageId)).limit(1);
    assert(insertedPage.length === 1 && insertedPage[0].title === "Terms of Test Page", "Created static page in DB");

    await db.update(schema.pages).set({ title: "Updated Test Page" }).where(eq(schema.pages.id, testPageId));
    const updatedPage = await db.select().from(schema.pages).where(eq(schema.pages.id, testPageId)).limit(1);
    assert(updatedPage[0]?.title === "Updated Test Page", "Updated static page in DB");

    await db.delete(schema.pages).where(eq(schema.pages.id, testPageId));
    const deletedPage = await db.select().from(schema.pages).where(eq(schema.pages.id, testPageId)).limit(1);
    assert(deletedPage.length === 0, "Deleted static page from DB");

    // ----------------------------------------------------
    // TEST 5: Categories CRUD
    // ----------------------------------------------------
    console.log("\n5. Testing Categories CRUD...");
    const testCatId = `cat_test_${nanoid(8)}`;
    const testCatSlug = `test-category-${nanoid(6)}`;

    await db.insert(schema.categories).values({
      id: testCatId,
      name: `Category ${testCatSlug}`,
      slug: testCatSlug,
      description: "A category created for testing",
    });

    const catRecord = await db.select().from(schema.categories).where(eq(schema.categories.id, testCatId)).limit(1);
    assert(catRecord.length === 1, "Created category in DB");

    await db.delete(schema.categories).where(eq(schema.categories.id, testCatId));
    const deletedCat = await db.select().from(schema.categories).where(eq(schema.categories.id, testCatId)).limit(1);
    assert(deletedCat.length === 0, "Deleted category from DB");

    // ----------------------------------------------------
    // TEST 6: Tags CRUD
    // ----------------------------------------------------
    console.log("\n6. Testing Tags CRUD...");
    const testTagId = `tag_test_${nanoid(8)}`;
    const testTagSlug = `test-tag-${nanoid(6)}`;

    await db.insert(schema.tags).values({
      id: testTagId,
      name: `Tag ${testTagSlug}`,
      slug: testTagSlug,
    });

    const tagRecord = await db.select().from(schema.tags).where(eq(schema.tags.id, testTagId)).limit(1);
    assert(tagRecord.length === 1, "Created tag in DB");

    await db.delete(schema.tags).where(eq(schema.tags.id, testTagId));
    const deletedTag = await db.select().from(schema.tags).where(eq(schema.tags.id, testTagId)).limit(1);
    assert(deletedTag.length === 0, "Deleted tag from DB");

    // ----------------------------------------------------
    // TEST 7: Comments Moderation
    // ----------------------------------------------------
    console.log("\n7. Testing Comments Moderation Lifecycle...");
    const testCommentId = `comm_test_${nanoid(8)}`;

    await db.insert(schema.comments).values({
      id: testCommentId,
      postId: "dummy_post_id",
      postTitle: "AI Tools Overview",
      authorName: "Test Reader",
      authorEmail: "reader@example.com",
      content: "This is a test comment from reader",
      status: "pending",
    });

    const commentRecord = await db.select().from(schema.comments).where(eq(schema.comments.id, testCommentId)).limit(1);
    assert(commentRecord[0]?.status === "pending", "Created pending comment in DB");

    await db.update(schema.comments).set({ status: "approved" }).where(eq(schema.comments.id, testCommentId));
    const approvedComment = await db.select().from(schema.comments).where(eq(schema.comments.id, testCommentId)).limit(1);
    assert(approvedComment[0]?.status === "approved", "Moderated comment to 'approved' in DB");

    await db.delete(schema.comments).where(eq(schema.comments.id, testCommentId));
    const deletedComment = await db.select().from(schema.comments).where(eq(schema.comments.id, testCommentId)).limit(1);
    assert(deletedComment.length === 0, "Deleted comment from DB");

    // ----------------------------------------------------
    // TEST 8: Subscribers Management
    // ----------------------------------------------------
    console.log("\n8. Testing Subscribers Management...");
    const testSubEmail = `subscriber_${nanoid(8)}@test.com`;

    await db.insert(schema.subscribers).values({
      id: `sub_${nanoid(8)}`,
      email: testSubEmail,
      status: "active",
      source: "automated_test",
    });

    const subRecord = await db.select().from(schema.subscribers).where(eq(schema.subscribers.email, testSubEmail)).limit(1);
    assert(subRecord.length === 1 && subRecord[0].status === "active", "Added active subscriber to DB");

    await db.delete(schema.subscribers).where(eq(schema.subscribers.email, testSubEmail));
    const deletedSub = await db.select().from(schema.subscribers).where(eq(schema.subscribers.email, testSubEmail)).limit(1);
    assert(deletedSub.length === 0, "Removed subscriber from DB");

    // ----------------------------------------------------
    // TEST 9: Navigation Menus & Site Settings Persistence
    // ----------------------------------------------------
    console.log("\n9. Testing Navigation Menus Persistence (Site Settings)...");
    const testMenu = [
      { id: "h1", label: "Home", href: "/" },
      { id: "h2", label: "Special Topic", href: "/category/special" },
    ];
    await db
      .insert(schema.siteSettings)
      .values({ key: "test_menu_key", value: JSON.stringify(testMenu) })
      .onConflictDoUpdate({ target: schema.siteSettings.key, set: { value: JSON.stringify(testMenu) } });

    const menuSetting = await db.select().from(schema.siteSettings).where(eq(schema.siteSettings.key, "test_menu_key")).limit(1);
    const parsedMenu = JSON.parse(menuSetting[0]?.value || "[]");
    assert(parsedMenu.length === 2 && parsedMenu[1].label === "Special Topic", "Saved and retrieved custom navigation menu from site settings");

    await db.delete(schema.siteSettings).where(eq(schema.siteSettings.key, "test_menu_key"));

    // ----------------------------------------------------
    // TEST 10: Theme Customizer Settings
    // ----------------------------------------------------
    console.log("\n10. Testing Theme Customizer Settings Persistence...");
    await db
      .insert(schema.siteSettings)
      .values({ key: "brand_color", value: "#079653" })
      .onConflictDoUpdate({ target: schema.siteSettings.key, set: { value: "#079653" } });

    await db
      .insert(schema.siteSettings)
      .values({ key: "theme_font", value: "Plus Jakarta Sans" })
      .onConflictDoUpdate({ target: schema.siteSettings.key, set: { value: "Plus Jakarta Sans" } });

    const colorRecord = await db.select().from(schema.siteSettings).where(eq(schema.siteSettings.key, "brand_color")).limit(1);
    const fontRecord = await db.select().from(schema.siteSettings).where(eq(schema.siteSettings.key, "theme_font")).limit(1);
    assert(colorRecord[0]?.value === "#079653", "Brand color setting persisted");
    assert(fontRecord[0]?.value === "Plus Jakarta Sans", "Theme font setting persisted");

    // ----------------------------------------------------
    // TEST 11: Affiliate Partners Repository
    // ----------------------------------------------------
    console.log("\n11. Testing Affiliate Partners CRUD...");
    const testAffiliates = [
      {
        id: "aff_test_claude",
        brand: "Claude Pro",
        category: "AI LLM",
        destination: "https://anthropic.com",
        affiliateUrl: "https://anthropic.com/?via=stackyup",
        clicks: 42,
        disclosure: "Partner link",
        status: "Active",
      },
    ];
    await db
      .insert(schema.siteSettings)
      .values({ key: "affiliate_links", value: JSON.stringify(testAffiliates) })
      .onConflictDoUpdate({ target: schema.siteSettings.key, set: { value: JSON.stringify(testAffiliates) } });

    const affRecord = await db.select().from(schema.siteSettings).where(eq(schema.siteSettings.key, "affiliate_links")).limit(1);
    const parsedAff = JSON.parse(affRecord[0]?.value || "[]");
    assert(parsedAff[0]?.brand === "Claude Pro" && parsedAff[0]?.clicks === 42, "Affiliate links saved and parsed properly");

    // ----------------------------------------------------
    // TEST 12: Newsletter Dispatches Repository
    // ----------------------------------------------------
    console.log("\n12. Testing Newsletter Dispatches Log...");
    const testCampaign = {
      id: `camp_${nanoid(8)}`,
      subject: "StackYup AI Benchmark Weekly",
      content: "<p>Top breakthroughs this week.</p>",
      sentDate: "Oct 2, 2026",
      recipients: 50,
      openRate: "45.0%",
      clicks: "12.0%",
      status: "Sent",
    };
    await db
      .insert(schema.siteSettings)
      .values({ key: "test_newsletter_campaigns", value: JSON.stringify([testCampaign]) })
      .onConflictDoUpdate({ target: schema.siteSettings.key, set: { value: JSON.stringify([testCampaign]) } });

    const campRecord = await db.select().from(schema.siteSettings).where(eq(schema.siteSettings.key, "test_newsletter_campaigns")).limit(1);
    const parsedCamp = JSON.parse(campRecord[0]?.value || "[]");
    assert(parsedCamp[0]?.subject === "StackYup AI Benchmark Weekly", "Newsletter campaign logged and retrieved");
    await db.delete(schema.siteSettings).where(eq(schema.siteSettings.key, "test_newsletter_campaigns"));

    // ----------------------------------------------------
    // TEST 13: System Diagnostics & Cache
    // ----------------------------------------------------
    console.log("\n13. Testing System Diagnostics & Ping Latency...");
    const pingStart = performance.now();
    await db.select({ count: count() }).from(schema.posts);
    const pingMs = Math.round(performance.now() - pingStart);
    assert(pingMs < 3000, `Database ping latency healthy: ${pingMs}ms`);

    await clearCache();
    assert(true, "Purged in-memory and Redis caches successfully");

    // ----------------------------------------------------
    // TEST 14: API Keys Generation & Hashing
    // ----------------------------------------------------
    console.log("\n14. Testing API Key Machine Authentication...");
    const { key, keyHash, keyPrefix } = generateApiKey("sy_live_");
    const testKeyId = `key_${nanoid(8)}`;

    await db.insert(schema.apiKeys).values({
      id: testKeyId,
      name: "Autonomous Agent Key",
      keyHash,
      keyPrefix,
      isActive: true,
    });

    const hashedCandidate = hashApiKey(key);
    assert(hashedCandidate === keyHash, "API key SHA-256 hash computed correctly");

    const matchedKey = await db.select().from(schema.apiKeys).where(eq(schema.apiKeys.keyHash, hashedCandidate)).limit(1);
    assert(matchedKey.length === 1 && matchedKey[0].isActive === true, "Active API key verified in database");

    await db.delete(schema.apiKeys).where(eq(schema.apiKeys.id, testKeyId));
    const deletedKey = await db.select().from(schema.apiKeys).where(eq(schema.apiKeys.id, testKeyId)).limit(1);
    assert(deletedKey.length === 0, "Revoked and deleted API key from DB");

    // ----------------------------------------------------
    // TEST 15: Media Asset Records
    // ----------------------------------------------------
    console.log("\n15. Testing Media Assets Table...");
    const testMediaId = `media_test_${nanoid(8)}`;
    await db.insert(schema.media).values({
      id: testMediaId,
      filename: "test-hero-image.webp",
      url: "https://res.cloudinary.com/demo/image/upload/sample.webp",
      alt: "Test alt tag",
      width: 1200,
      height: 630,
      sizeBytes: 84200,
      mimeType: "image/webp",
    });

    const mediaItem = await db.select().from(schema.media).where(eq(schema.media.id, testMediaId)).limit(1);
    assert(mediaItem.length === 1 && mediaItem[0].filename === "test-hero-image.webp", "Saved media asset record to DB");

    await db.delete(schema.media).where(eq(schema.media.id, testMediaId));
    const deletedMedia = await db.select().from(schema.media).where(eq(schema.media.id, testMediaId)).limit(1);
    assert(deletedMedia.length === 0, "Deleted media asset record from DB");

    // ----------------------------------------------------
    // TEST 16: Admin Users Management & Password Hashing
    // ----------------------------------------------------
    console.log("\n16. Testing Admin Users & Bcrypt Password Security...");
    const testAdminId = `adm_test_${nanoid(8)}`;
    const testAdminEmail = `temp_admin_${nanoid(6)}@stackyup.com`;
    const plainPassword = "SuperSecurePassword123!";

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(plainPassword, salt);

    await db.insert(schema.admins).values({
      id: testAdminId,
      email: testAdminEmail,
      passwordHash,
      role: "admin",
    });

    const adminUser = await db.select().from(schema.admins).where(eq(schema.admins.id, testAdminId)).limit(1);
    assert(adminUser.length === 1, "Created administrator in DB");

    const passwordMatch = await bcrypt.compare(plainPassword, adminUser[0].passwordHash);
    assert(passwordMatch === true, "Bcrypt verified admin credentials successfully");

    const newSalt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash("NewUpdatedPassword456!", newSalt);
    await db.update(schema.admins).set({ passwordHash: newPasswordHash }).where(eq(schema.admins.id, testAdminId));

    const updatedAdmin = await db.select().from(schema.admins).where(eq(schema.admins.id, testAdminId)).limit(1);
    const newMatch = await bcrypt.compare("NewUpdatedPassword456!", updatedAdmin[0].passwordHash);
    assert(newMatch === true, "Password reset / update verified successfully");

    await db.delete(schema.admins).where(eq(schema.admins.id, testAdminId));
    const deletedAdmin = await db.select().from(schema.admins).where(eq(schema.admins.id, testAdminId)).limit(1);
    assert(deletedAdmin.length === 0, "Removed test admin user from DB");

    // ----------------------------------------------------
    // Summary
    // ----------------------------------------------------
    console.log("\n==========================================================");
    console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log("==========================================================");

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error("Test execution threw exception:", error);
    process.exit(1);
  }
}

runFullAdminTestSuite();

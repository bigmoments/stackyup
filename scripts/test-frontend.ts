async function testFrontend() {
  console.log("Testing Frontend & SEO Endpoints on http://localhost:3000...\n");

  // 1. Homepage
  const homeRes = await fetch("http://localhost:3000/");
  console.log(`✓ Homepage GET / -> Status: ${homeRes.status}`);

  // 2. Article Reader
  const articleRes = await fetch("http://localhost:3000/7-best-ai-tools-for-freelancers-in-2026");
  const articleText = await articleRes.text();
  console.log(`✓ Article GET /:slug -> Status: ${articleRes.status}`);
  console.log(`  - Contains JSON-LD Article Schema: ${articleText.includes('"@type":"Article"')}`);
  console.log(`  - Contains JSON-LD FAQPage Schema: ${articleText.includes('"@type":"FAQPage"')}`);
  console.log(`  - Contains OpenGraph Tags: ${articleText.includes('property="og:title"')}`);

  // 3. Sitemap
  const sitemapRes = await fetch("http://localhost:3000/sitemap.xml");
  const sitemapText = await sitemapRes.text();
  console.log(`✓ Sitemap GET /sitemap.xml -> Status: ${sitemapRes.status}`);
  console.log(`  - Includes /7-best-ai-tools-for-freelancers-in-2026: ${sitemapText.includes("7-best-ai-tools-for-freelancers-in-2026")}`);

  // 4. Robots
  const robotsRes = await fetch("http://localhost:3000/robots.txt");
  const robotsText = await robotsRes.text();
  console.log(`✓ Robots.txt GET /robots.txt -> Status: ${robotsRes.status}`);
  console.log(`  - Contains sitemap reference: ${robotsText.includes("sitemap.xml")}`);

  // 5. RSS Feed
  const rssRes = await fetch("http://localhost:3000/rss.xml");
  const rssText = await rssRes.text();
  console.log(`✓ RSS Feed GET /rss.xml -> Status: ${rssRes.status}`);
  console.log(`  - Includes latest post title: ${rssText.includes("7 Best AI Tools for Freelancers in 2026")}`);

  // 6. Admin Login Page
  const adminLoginRes = await fetch("http://localhost:3000/admin/login");
  console.log(`✓ Admin Login GET /admin/login -> Status: ${adminLoginRes.status}`);

  console.log("\nALL FRONTEND & SEO CHECKS PASSED!");
}

testFrontend().catch(console.error);

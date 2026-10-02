import { MetadataRoute } from "next";

// Vercel Resource Optimization: 24-hour cache for robots.txt
export const revalidate = 86400;

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stackyup.com";

  const aiBots = [
    "GPTBot",
    "ChatGPT-User",
    "PerplexityBot",
    "ClaudeBot",
    "anthropic-ai",
    "Google-Extended",
    "Applebot-Extended",
    "cohere-ai",
  ];

  // Aggressive commercial scrapers that consume heavy serverless compute without delivering visitor traffic
  const rogueScrapers = [
    "Bytespider",
    "SemrushBot",
    "AhrefsBot",
    "MJ12bot",
    "DotBot",
    "PetalBot",
    "Amazonbot",
    "DataForSeoBot",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
      ...aiBots.map((bot) => ({
        userAgent: bot,
        allow: "/",
        disallow: ["/admin/", "/api/"],
      })),
      ...rogueScrapers.map((bot) => ({
        userAgent: bot,
        disallow: ["/"],
      })),
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

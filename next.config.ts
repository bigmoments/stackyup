import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "blogger.googleusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.bp.blogspot.com" },
      { protocol: "https", hostname: "cdn.stackyup.com" },
    ],
  },
  compress: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // 301 Redirect for Blogger Legacy Post URLs: /2024/05/slug.html -> /slug
      {
        source: "/:year(\\d{4})/:month(\\d{2})/:slug.html",
        destination: "/:slug",
        permanent: true,
      },
      // 301 Redirect for Blogger Legacy Page URLs: /p/slug.html -> /page/slug
      {
        source: "/p/:slug.html",
        destination: "/page/:slug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

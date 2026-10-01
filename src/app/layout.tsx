import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import CookieBanner from "@/components/public/CookieBanner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://stackyup.com"),
  title: {
    default: "StackYup — AI Tools & SaaS Reviews & Comparisons",
    template: "%s | StackYup",
  },
  description: "In-depth benchmarks, honest comparisons, and reviews of top artificial intelligence software and SaaS tools in 2026.",
  openGraph: {
    title: "StackYup — AI Tools & SaaS Reviews",
    description: "In-depth benchmarks, honest comparisons, and reviews of top artificial intelligence software and SaaS tools in 2026.",
    url: "https://stackyup.com",
    siteName: "StackYup",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StackYup — AI Tools & SaaS Reviews",
    description: "In-depth benchmarks, honest comparisons, and reviews of top artificial intelligence software and SaaS tools in 2026.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#070b14] text-slate-100">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}

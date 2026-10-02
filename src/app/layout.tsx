import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import CookieBanner from "@/components/public/CookieBanner";
import GoogleAnalytics from "@/components/public/GoogleAnalytics";
import { DialogProvider } from "@/components/ui/CustomDialog";
import { getSiteSettings } from "@/lib/site-settings";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();
  const gaId = settings.google_analytics_id || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-[#101313] selection:bg-[#078a4b]/15 selection:text-[#101313]">
        <DialogProvider>
          {/* Google Analytics 4 Script Tracking */}
          {gaId && <GoogleAnalytics measurementId={gaId} />}

          {/* Modern glowing top progress bar during route transitions */}
          <NextTopLoader
            color="#078a4b"
            initialPosition={0.08}
            crawlSpeed={200}
            height={3}
            crawl={true}
            showSpinner={false}
            easing="ease"
            speed={200}
            shadow="0 0 10px #078a4b, 0 0 5px #078a4b"
          />
          {children}
          <CookieBanner />
        </DialogProvider>
      </body>
    </html>
  );
}


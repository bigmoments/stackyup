import { count } from "drizzle-orm";
import { db, schema } from "@/db";
import Link from "next/link";
import { Globe, ExternalLink, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sitemap Status — StackYup Admin",
};

export default async function AdminSitemapPage() {
  const [postsCount, pagesCount, catsCount] = await Promise.all([
    db.select({ count: count() }).from(schema.posts).catch(() => [{ count: 0 }]),
    db.select({ count: count() }).from(schema.pages).catch(() => [{ count: 0 }]),
    db.select({ count: count() }).from(schema.categories).catch(() => [{ count: 0 }]),
  ]);

  const totalUrls = (postsCount[0]?.count || 0) + (pagesCount[0]?.count || 0) + (catsCount[0]?.count || 0) + 1;

  return (
    <div className="space-y-6 font-sans max-w-4xl">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] block mb-1">
          Search Crawling
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101313]">
          XML Sitemap
        </h1>
        <p className="text-xs text-[#667085] mt-0.5">
          Automatic dynamic sitemap submitted to Google Search Console and Bing Webmaster.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E6EBE8]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF8F0] text-[#079653] flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#101313]">Dynamic XML Sitemap Feed</h3>
              <span className="text-xs text-[#667085]">Automatically synced on publish with Next.js App Router</span>
            </div>
          </div>

          <Link
            href="/sitemap.xml"
            target="_blank"
            className="px-4 py-2 rounded-xl bg-[#079653] hover:bg-[#068046] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <span>View Live /sitemap.xml</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8]">
            <span className="text-xs text-[#667085] block">Total Indexed URLs</span>
            <span className="text-xl font-extrabold text-[#101313] block mt-1">{totalUrls}</span>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8]">
            <span className="text-xs text-[#667085] block">Post Articles</span>
            <span className="text-xl font-extrabold text-[#101313] block mt-1">{postsCount[0]?.count || 0}</span>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8]">
            <span className="text-xs text-[#667085] block">Static Pages</span>
            <span className="text-xl font-extrabold text-[#101313] block mt-1">{pagesCount[0]?.count || 0}</span>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8]">
            <span className="text-xs text-[#667085] block">Category Archives</span>
            <span className="text-xl font-extrabold text-[#101313] block mt-1">{catsCount[0]?.count || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

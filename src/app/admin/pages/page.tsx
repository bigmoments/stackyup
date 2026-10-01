import Link from "next/link";
import { desc } from "drizzle-orm";
import { Layers, ExternalLink, Plus, Edit } from "lucide-react";
import { db, schema } from "@/db";

export const dynamic = "force-dynamic";

export default async function AdminPagesPage() {
  const pagesList = await db
    .select()
    .from(schema.pages)
    .orderBy(desc(schema.pages.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Static Pages</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage essential institutional pages (About, Contact, Privacy Policy, Disclaimer)
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900/50 border border-slate-800 overflow-hidden shadow-xl">
        {pagesList.length === 0 ? (
          <div className="p-12 text-center">
            <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">No static pages found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You can create pages via the Publishing API (<code className="text-indigo-400">POST /api/v1/pages</code>) or import from Blogger XML.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 bg-slate-950/40">
                  <th className="py-4 px-6">Page Title</th>
                  <th className="py-4 px-6">Slug URL</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Last Updated</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {pagesList.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-4 px-6 font-semibold text-slate-100">
                      {p.title}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400 font-mono">
                      /page/{p.slug}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400">
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/page/${p.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-400 transition"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

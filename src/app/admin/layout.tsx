import { ReactNode } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { getCurrentAdmin } from "@/lib/admin-session";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = {
  title: "StackYup CMS Admin Dashboard",
  description: "Modern headless publishing control panel",
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "";
  const isLoginPage = pathname.includes("/admin/login");

  const session = await getCurrentAdmin();

  // If on login page, render clean layout without sidebar
  if (isLoginPage || !session) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-center">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex">
      {/* Sidebar Navigation */}
      <AdminSidebar currentEmail={session.email} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/80 bg-[#090e1c]/80 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
              StackYup CMS v1.0
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="text-xs font-medium text-slate-400 hover:text-white transition flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/50"
            >
              <span>View Public Site</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>

            <Link
              href="/admin/posts/new"
              className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg transition shadow-lg shadow-indigo-600/20 flex items-center gap-1.5"
            >
              <span>+ New Article</span>
            </Link>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

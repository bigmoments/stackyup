"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  Search,
  ExternalLink,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Settings,
} from "lucide-react";
import { SessionData } from "@/lib/admin-session";

interface AdminTopbarProps {
  session: SessionData;
  onToggleSidebar?: () => void;
}

export default function AdminTopbar({ session, onToggleSidebar }: AdminTopbarProps) {
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/admin/posts?search=${encodeURIComponent(searchQuery)}`);
  }

  return (
    <header className="h-16 bg-white border-b border-[#E6EBE8] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none gap-2">
      {/* Left: Hamburger & Global Search */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 max-w-md">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-[#667085] hover:text-[#101313] hover:bg-[#F8FAF9] transition lg:hidden cursor-pointer shrink-0"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative w-full max-w-[200px] sm:max-w-[340px] flex items-center"
        >
          <Search className="w-4 h-4 text-[#8a9099] absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 sm:pr-14 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] placeholder:text-[#8a9099] focus:outline-none focus:border-[#079653] focus:bg-white transition"
          />
          <kbd className="hidden sm:inline-block absolute right-2 px-1.5 py-0.5 rounded border border-[#E6EBE8] bg-white text-[10px] font-mono text-[#8a9099] pointer-events-none">
            Ctrl K
          </kbd>
        </form>
      </div>

      {/* Right: Actions, Notifications, User Menu */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* View Site ↗ Button */}
        <Link
          href="/"
          target="_blank"
          className="h-9 px-2.5 sm:px-3 rounded-xl border border-[#E6EBE8] hover:bg-[#F8FAF9] text-[#101313] text-xs font-semibold flex items-center gap-1.5 transition"
          title="View Public Site"
        >
          <span className="hidden sm:inline">View Site</span>
          <ExternalLink className="w-3.5 h-3.5 text-[#667085]" />
        </Link>

        {/* Notification Bell */}
        <button
          type="button"
          className="relative p-2 rounded-xl text-[#667085] hover:text-[#101313] hover:bg-[#F8FAF9] transition cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#079653]" />
        </button>

        {/* User Menu Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#F8FAF9] transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-[#101313] text-white flex items-center justify-center font-bold text-xs">
              A
            </div>
            <div className="text-left hidden md:block">
              <span className="font-bold text-xs text-[#101313] block leading-tight">
                Adit
              </span>
              <span className="text-[10px] text-[#667085] block leading-tight">
                Administrator
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#8a9099]" />
          </button>

          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-[#E6EBE8] shadow-lg py-1.5 z-50 text-xs text-[#101313] font-sans">
                <div className="px-3 py-2 border-b border-[#E6EBE8] mb-1">
                  <p className="font-semibold text-xs text-[#101313]">Adit</p>
                  <p className="text-[11px] text-[#667085] truncate">{session.email}</p>
                </div>

                <Link
                  href="/admin/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-[#F8FAF9] transition"
                >
                  <Settings className="w-3.5 h-3.5 text-[#667085]" />
                  <span>Account Settings</span>
                </Link>

                <Link
                  href="/"
                  target="_blank"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-[#F8FAF9] transition"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#667085]" />
                  <span>View Public Site</span>
                </Link>

                <div className="h-px bg-[#E6EBE8] my-1" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 transition cursor-pointer text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

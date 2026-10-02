"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { SessionData } from "@/lib/admin-session";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

interface AdminShellProps {
  session: SessionData;
  children: React.ReactNode;
}

export default function AdminShell({ session, children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Automatically close mobile drawer when navigating
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#F7F9F8] text-[#101313] flex font-sans antialiased relative">
      {/* Mobile Drawer Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar: Sticky Desktop + Smooth Off-Canvas Drawer on Mobile */}
      <AdminSidebar
        currentEmail={session.email}
        isOpenMobile={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Workspace Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar with Responsive Hamburger, Search, and User Controls */}
        <AdminTopbar
          session={session}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

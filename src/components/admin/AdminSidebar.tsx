"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Plus,
  FolderTree,
  Tag,
  Image as ImageIcon,
  Layers,
  MessageSquare,
  Settings,
  Menu,
  Palette,
  Mail,
  Users,
  BarChart3,
  Megaphone,
  Link2,
  Search,
  Globe,
  CornerDownRight,
  Database,
  Sliders,
  Bot,
  Key,
  UploadCloud,
  ChevronDown,
  X,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: any;
  hasCreate?: boolean;
  createHref?: string;
  badge?: string;
}

interface NavCategory {
  id: string;
  title: string;
  icon?: any;
  items: NavItem[];
}

interface AdminSidebarProps {
  currentEmail?: string;
  isOpenMobile?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({
  currentEmail,
  isOpenMobile = false,
  onClose,
}: AdminSidebarProps) {
  const pathname = usePathname();

  // Structured, clearly organized menu categories
  const categories: NavCategory[] = [
    {
      id: "content",
      title: "Content & Editorial",
      items: [
        {
          label: "Posts",
          href: "/admin/posts",
          icon: FileText,
          hasCreate: true,
          createHref: "/admin/posts/new",
        },
        { label: "Categories", href: "/admin/categories", icon: FolderTree },
        { label: "Tags", href: "/admin/tags", icon: Tag },
        { label: "Authors", href: "/admin/authors", icon: Users },
        { label: "Pages", href: "/admin/pages", icon: Layers },
        { label: "Media Library", href: "/admin/media", icon: ImageIcon },
        { label: "Comments", href: "/admin/comments", icon: MessageSquare },
      ],
    },
    {
      id: "appearance",
      title: "Design & Appearance",
      items: [
        { label: "Site Settings", href: "/admin/settings", icon: Settings },
        { label: "Theme & Styling", href: "/admin/theme", icon: Palette },
        { label: "Navigation Menus", href: "/admin/menus", icon: Menu },
      ],
    },
    {
      id: "monetization",
      title: "Monetization & Growth",
      items: [
        { label: "Ad Slots", href: "/admin/advertisements", icon: Megaphone },
        { label: "Affiliate Partners", href: "/admin/affiliates", icon: Link2 },
        { label: "Newsletter", href: "/admin/newsletter", icon: Mail },
        { label: "Subscribers", href: "/admin/subscribers", icon: Users },
        { label: "Analytics & Traffic", href: "/admin/analytics", icon: BarChart3 },
      ],
    },
    {
      id: "automation",
      title: "AI & Automations",
      items: [
        { label: "AI Agents Hub", href: "/admin/ai-agents", icon: Bot, badge: "MCP" },
        { label: "API Keys", href: "/admin/api-keys", icon: Key },
      ],
    },
    {
      id: "tools",
      title: "SEO & Tools",
      items: [
        { label: "SEO Audit", href: "/admin/seo", icon: Search },
        { label: "Sitemap Generator", href: "/admin/sitemap", icon: Globe },
        { label: "URL Redirects", href: "/admin/redirects", icon: CornerDownRight },
        { label: "Content Importer", href: "/admin/import", icon: UploadCloud },
      ],
    },
    {
      id: "system",
      title: "System & Maintenance",
      items: [
        { label: "Admin Users", href: "/admin/users", icon: Users },
        { label: "Cache & Performance", href: "/admin/system", icon: Sliders },
        { label: "Backups", href: "/admin/backups", icon: Database },
      ],
    },
  ];

  // Collapsible state with smart defaults (avoids SSR hydration mismatch):
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  // Sync saved collapsed state from localStorage after mount on client
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("sy_admin_sidebar_collapsed");
      if (saved) {
        setCollapsedCategories(JSON.parse(saved));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Ensure active category is expanded on navigation
  useEffect(() => {
    for (const cat of categories) {
      const hasActive = cat.items.some((item) =>
        item.href === "/admin"
          ? pathname === "/admin"
          : pathname.startsWith(item.href)
      );
      if (hasActive && collapsedCategories[cat.id]) {
        setCollapsedCategories((prev) => ({ ...prev, [cat.id]: false }));
      }
    }
  }, [pathname]);

  function toggleCategory(catId: string) {
    setCollapsedCategories((prev) => {
      const next = { ...prev, [catId]: !prev[catId] };
      try {
        localStorage.setItem("sy_admin_sidebar_collapsed", JSON.stringify(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  }

  const isDashboardActive = pathname === "/admin";

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-[#E6EBE8] flex flex-col justify-between select-none h-screen max-h-screen font-sans transition-transform duration-200 ease-in-out lg:sticky lg:top-0 lg:translate-x-0 lg:z-30 shrink-0 ${
        isOpenMobile ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      <div className="flex flex-col h-full min-h-0">
        {/* Fixed Header Brand (h-16 shrink-0) */}
        <div className="h-16 px-5 border-b border-[#E6EBE8] flex items-center justify-between shrink-0 bg-white">
          <Link
            href="/admin"
            onClick={() => onClose?.()}
            className="flex items-center gap-1.5 group"
          >
            <span className="font-extrabold text-[20px] tracking-tight text-[#101313]">
              StackYup
            </span>
            <span className="w-2 h-2 rounded-full bg-[#079653] inline-block mb-1 group-hover:scale-125 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#079653] bg-[#EAF8F0] px-1.5 py-0.5 rounded-md ml-1">
              Admin
            </span>
          </Link>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-[#8a9099] hover:text-[#101313] hover:bg-[#F8FAF9] transition cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Fixed Dashboard Nav Item */}
        <div className="p-3 pb-0 shrink-0 bg-white">
          <Link
            href="/admin"
            onClick={() => onClose?.()}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
              isDashboardActive
                ? "bg-[#EAF8F0] text-[#079653] shadow-xs"
                : "text-[#4b5563] hover:text-[#101313] hover:bg-[#F8FAF9]"
            }`}
          >
            <LayoutDashboard
              className={`w-4 h-4 shrink-0 ${
                isDashboardActive ? "text-[#079653]" : "text-[#8a9099]"
              }`}
            />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* Scrollable Navigation Menu (Takes remaining height, fixed container) */}
        <nav className="p-3 pt-2 space-y-2 flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar">
          {categories.map((cat) => {
            const isCollapsed = mounted && Boolean(collapsedCategories[cat.id]);
            const hasActiveChild = cat.items.some((item) =>
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href)
            );

            return (
              <div key={cat.id} className="pt-2 first:pt-0">
                {/* Collapsible Section Header Button (Clean & Flat) */}
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#8a9099] hover:text-[#101313] transition-colors cursor-pointer group"
                >
                  <span className="flex items-center gap-2 truncate">
                    {hasActiveChild && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#079653] shrink-0" />
                    )}
                    <span className="truncate">{cat.title}</span>
                  </span>

                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#8a9099] group-hover:text-[#101313] transition-transform duration-200 shrink-0 ${
                      isCollapsed ? "-rotate-90" : "rotate-0"
                    }`}
                  />
                </button>

                {/* Sub-menu items (Hidden if collapsed) */}
                {!isCollapsed && (
                  <div className="space-y-0.5 mt-1">
                    {cat.items.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        item.href === "/admin"
                          ? pathname === "/admin"
                          : pathname.startsWith(item.href);

                      return (
                        <div
                          key={item.href}
                          className="flex items-center justify-between group rounded-xl relative"
                        >
                          <Link
                            href={item.href}
                            onClick={() => onClose?.()}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors flex-1 ${
                              isActive
                                ? "bg-[#EAF8F0] text-[#079653] font-semibold"
                                : "text-[#4b5563] hover:text-[#101313] hover:bg-[#F8FAF9]"
                            }`}
                          >
                            <Icon
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                isActive
                                  ? "text-[#079653]"
                                  : "text-[#8a9099] group-hover:text-[#101313]"
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </Link>

                          {/* Quick Create '+' button for Posts */}
                          {item.hasCreate && (
                            <Link
                              href={item.createHref || "/admin/posts/new"}
                              onClick={() => onClose?.()}
                              title="Create New Post"
                              className="p-1 mr-1 text-[#8a9099] hover:text-[#079653] hover:bg-[#EAF8F0] rounded-lg transition"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </Link>
                          )}

                          {/* Badge count */}
                          {item.badge && (
                            <span className="mr-1.5 px-1.5 py-0.2 rounded-md bg-[#079653] text-white text-[9px] font-bold">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Fixed User Info / Footer in Sidebar */}
        <div className="p-3 border-t border-[#E6EBE8] bg-[#FAFCFB] shrink-0">
          <div className="flex items-center justify-between gap-2 px-2 py-1">
            <div className="truncate">
              <span className="text-[10px] uppercase font-bold text-[#8a9099] block leading-tight">
                Logged in as
              </span>
              <span className="text-xs font-semibold text-[#101313] truncate block">
                {currentEmail || "admin@stackyup.com"}
              </span>
            </div>

            <Link
              href="/"
              target="_blank"
              title="Open Public Site"
              className="px-2 py-1 rounded-md bg-white border border-[#E6EBE8] hover:border-[#079653] text-[11px] font-semibold text-[#079653] transition shrink-0"
            >
              Live Site ?
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}

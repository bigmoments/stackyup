"use client";

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

interface NavSection {
  title: string | null;
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

  const sections: NavSection[] = [
    {
      title: null,
      items: [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      ],
    },
    {
      title: "CONTENT",
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
        { label: "Media", href: "/admin/media", icon: ImageIcon },
        { label: "Pages", href: "/admin/pages", icon: Layers },
        {
          label: "Comments",
          href: "/admin/comments",
          icon: MessageSquare,
        },
      ],
    },
    {
      title: "APPEARANCE",
      items: [
        { label: "Site Settings", href: "/admin/settings", icon: Settings },
        { label: "Menus", href: "/admin/menus", icon: Menu },
        { label: "Theme", href: "/admin/theme", icon: Palette },
      ],
    },
    {
      title: "ENGAGEMENT",
      items: [
        { label: "Newsletter", href: "/admin/newsletter", icon: Mail },
        { label: "Subscribers", href: "/admin/subscribers", icon: Users },
        { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      ],
    },
    {
      title: "MONETIZATION",
      items: [
        { label: "Advertisements", href: "/admin/advertisements", icon: Megaphone },
        { label: "Affiliate Links", href: "/admin/affiliates", icon: Link2 },
      ],
    },
    {
      title: "AI & AGENTS",
      items: [
        { label: "AI Agents Hub", href: "/admin/ai-agents", icon: Bot, badge: "MCP" },
        { label: "API Keys", href: "/admin/api-keys", icon: Key },
      ],
    },
    {
      title: "TOOLS",
      items: [
        { label: "SEO Audit", href: "/admin/seo", icon: Search },
        { label: "Sitemap", href: "/admin/sitemap", icon: Globe },
        { label: "Redirects", href: "/admin/redirects", icon: CornerDownRight },
        { label: "Import Content", href: "/admin/import", icon: UploadCloud },
      ],
    },
    {
      title: "SYSTEM",
      items: [
        { label: "Users", href: "/admin/users", icon: Users },
        { label: "System & Cache", href: "/admin/system", icon: Sliders },
        { label: "Backups", href: "/admin/backups", icon: Database },
      ],
    },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-[240px] bg-white border-r border-[#E6EBE8] flex flex-col justify-between select-none h-screen font-sans transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 lg:z-30 shrink-0 ${
        isOpenMobile ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="h-16 px-5 border-b border-[#E6EBE8] flex items-center justify-between">
          <Link
            href="/admin"
            onClick={() => onClose?.()}
            className="flex items-center gap-1 group"
          >
            <span className="font-extrabold text-[20px] tracking-tight text-[#101313]">
              StackYup
            </span>
            <span className="w-2 h-2 rounded-full bg-[#079653] inline-block mb-1 group-hover:scale-125 transition-transform" />
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

        {/* Scrollable Navigation Menu */}
        <nav className="p-3 space-y-4 max-h-[calc(100vh-64px)] overflow-y-auto no-scrollbar">
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-0.5">
              {section.title && (
                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#8a9099] block mb-1">
                  {section.title}
                </span>
              )}

              {section.items.map((item) => {
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
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? "text-[#079653]" : "text-[#8a9099] group-hover:text-[#101313]"
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
                        className="p-1.5 mr-1 text-[#8a9099] hover:text-[#079653] hover:bg-white rounded-lg transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Link>
                    )}

                    {/* Badge count */}
                    {item.badge && (
                      <span className="mr-2 px-1.5 py-0.2 rounded-full bg-[#079653] text-white text-[10px] font-bold">
                        {item.badge}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}

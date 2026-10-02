import { ReactNode } from "react";
import { headers } from "next/headers";
import { getCurrentAdmin } from "@/lib/admin-session";
import AdminShell from "@/components/admin/AdminShell";

export const metadata = {
  title: "StackYup Admin Dashboard",
  description: "Modern headless editorial control panel and workspace",
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "";
  const isLoginPage = pathname.includes("/admin/login");

  const session = await getCurrentAdmin();

  // If on login page, render clean layout without sidebar/topbar
  if (isLoginPage || !session) {
    return (
      <div className="min-h-screen bg-[#F7F9F8] text-[#101313] flex flex-col justify-center font-sans">
        {children}
      </div>
    );
  }

  return <AdminShell session={session}>{children}</AdminShell>;
}

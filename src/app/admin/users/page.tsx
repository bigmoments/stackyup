import { db, schema } from "@/db";
import { getCurrentAdmin } from "@/lib/admin-session";
import UsersClient, { AdminUserItem } from "./UsersClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Users — StackYup Admin",
};

export default async function AdminUsersPage() {
  const [adminsList, session] = await Promise.all([
    db.select().from(schema.admins),
    getCurrentAdmin(),
  ]);

  const formattedAdmins: AdminUserItem[] = adminsList.map((a) => ({
    id: a.id,
    email: a.email,
    role: a.role,
    createdAt: a.createdAt,
  }));

  return (
    <UsersClient
      initialAdmins={formattedAdmins}
      currentUserEmail={session?.email || ""}
    />
  );
}

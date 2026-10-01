import { destroyAdminSession } from "@/lib/admin-session";
import { successResponse } from "@/lib/response";

export async function POST() {
  await destroyAdminSession();
  return successResponse({ message: "Logged out successfully" });
}

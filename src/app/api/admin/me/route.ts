import { destroyAdminSession, getCurrentAdmin } from "@/lib/admin-session";
import { successResponse, errorResponse } from "@/lib/response";

export async function POST() {
  await destroyAdminSession();
  return successResponse({ message: "Logged out successfully" });
}

export async function GET() {
  const session = await getCurrentAdmin();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Not logged in", null, 401);
  }

  return successResponse({
    authenticated: true,
    email: session.email,
  });
}

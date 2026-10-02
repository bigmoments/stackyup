import { NextRequest, NextResponse } from "next/server";
import { getQStashReceiver, publishDueScheduledPosts } from "@/lib/qstash";

export const dynamic = "force-dynamic";

/**
 * Endpoint to trigger auto-publication of scheduled posts.
 * Can be called by:
 * 1. Upstash QStash Cron / Schedules (verified via Upstash-Signature header)
 * 2. Manual / External cron with Bearer CMS_API_KEY
 * 3. Direct GET for health/manual check if bearer authorized
 */
async function handlePublishRequest(request: NextRequest) {
  const receiver = getQStashReceiver();
  const authHeader = request.headers.get("authorization");
  const signature = request.headers.get("upstash-signature");
  const cmsApiKey = process.env.CMS_API_KEY;

  let isAuthorized = false;

  // 1. Verify via Upstash QStash cryptographic signature
  if (receiver && signature) {
    try {
      const rawBody = await request.clone().text();
      // Receiver verifies signature against current or next signing key
      await receiver.verify({
        signature,
        body: rawBody,
      });
      isAuthorized = true;
    } catch (err) {
      console.warn("[Cron/QStash] Signature verification failed:", err);
    }
  }

  // 2. Fallback: Verify via Bearer CMS_API_KEY or query param ?key=
  if (!isAuthorized) {
    const bearerToken = authHeader?.replace(/^Bearer\s+/i, "");
    const searchParams = request.nextUrl.searchParams;
    const queryKey = searchParams.get("key");

    if (
      (bearerToken && cmsApiKey && bearerToken === cmsApiKey) ||
      (queryKey && cmsApiKey && queryKey === cmsApiKey)
    ) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return NextResponse.json(
      { error: "Unauthorized. Valid Upstash signature or CMS_API_KEY required." },
      { status: 401 }
    );
  }

  try {
    const result = await publishDueScheduledPosts();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    console.error("[Cron/QStash] Error running scheduled post publisher:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return handlePublishRequest(request);
}

export async function GET(request: NextRequest) {
  return handlePublishRequest(request);
}

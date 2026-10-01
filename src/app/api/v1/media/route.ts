import { NextRequest } from "next/server";
import { desc, count } from "drizzle-orm";
import { verifyApiKey } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/response";
import { uploadFile } from "@/lib/storage";
import { db, schema } from "@/db";

// POST /api/v1/media - Upload image
export async function POST(request: NextRequest) {
  const auth = await verifyApiKey(request);
  if (!auth.authenticated) {
    return errorResponse("UNAUTHORIZED", auth.error || "Unauthorized", null, 401);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const alt = (formData.get("alt") as string) || undefined;

    if (!file) {
      return errorResponse("VALIDATION_ERROR", "Missing 'file' field in form data", { field: "file" }, 422);
    }

    // Size check (max 5 MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return errorResponse(
        "VALIDATION_ERROR",
        `File size exceeds 5MB limit (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
        { size: file.size, maxSize: MAX_SIZE },
        422
      );
    }

    // MIME type check
    const allowedMime = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (file.type && !allowedMime.includes(file.type)) {
      return errorResponse(
        "VALIDATION_ERROR",
        `Unsupported media type: ${file.type}. Allowed: jpg, png, webp, gif, svg`,
        { mimeType: file.type },
        422
      );
    }

    // Get origin for URL generation
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const origin = `${protocol}://${host}`;

    // Upload via storage adapter
    const uploadResult = await uploadFile(file, alt, origin);

    // Save to media table
    await db.insert(schema.media).values({
      id: uploadResult.id,
      filename: uploadResult.filename,
      url: uploadResult.url,
      alt: uploadResult.alt,
      width: uploadResult.width,
      height: uploadResult.height,
      sizeBytes: uploadResult.sizeBytes,
      mimeType: uploadResult.mimeType,
    });

    return successResponse(
      {
        id: uploadResult.id,
        url: uploadResult.url,
        alt: uploadResult.alt,
        width: uploadResult.width,
        height: uploadResult.height,
      },
      201
    );
  } catch (error) {
    console.error("Error in POST /api/v1/media:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to upload media", null, 500);
  }
}

// GET /api/v1/media - List media
export async function GET(request: NextRequest) {
  const auth = await verifyApiKey(request);
  if (!auth.authenticated) {
    return errorResponse("UNAUTHORIZED", auth.error || "Unauthorized", null, 401);
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);

    const [items, totalCount] = await Promise.all([
      db
        .select()
        .from(schema.media)
        .orderBy(desc(schema.media.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ value: count() }).from(schema.media),
    ]);

    return successResponse({
      items,
      pagination: {
        limit,
        offset,
        total: totalCount[0]?.value || 0,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/v1/media:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to retrieve media", null, 500);
  }
}

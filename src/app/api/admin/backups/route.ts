import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { getCurrentAdmin } from "@/lib/admin-session";
import { errorResponse } from "@/lib/response";

export async function GET() {
  try {
    const session = await getCurrentAdmin();
    if (!session) return errorResponse("UNAUTHORIZED", "Unauthorized", null, 401);

    const [posts, pages, media, comments, categories, tags, settings] = await Promise.all([
      db.select().from(schema.posts),
      db.select().from(schema.pages),
      db.select().from(schema.media),
      db.select().from(schema.comments),
      db.select().from(schema.categories),
      db.select().from(schema.tags),
      db.select().from(schema.siteSettings),
    ]);

    const backupData = {
      version: "1.0",
      site: "StackYup",
      timestamp: new Date().toISOString(),
      counts: {
        posts: posts.length,
        pages: pages.length,
        media: media.length,
        comments: comments.length,
        categories: categories.length,
        tags: tags.length,
      },
      data: {
        posts,
        pages,
        media,
        comments,
        categories,
        tags,
        settings,
      },
    };

    const fileName = `stackyup-backup-${new Date().toISOString().split("T")[0]}.json`;

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}

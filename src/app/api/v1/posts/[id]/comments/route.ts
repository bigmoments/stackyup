import { NextRequest, NextResponse } from "next/server";
import { eq, desc, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, schema } from "@/db";
import { cleanHtml } from "@/lib/sanitizer";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Match by id or slug
  let targetPost = await db
    .select({ id: schema.posts.id, title: schema.posts.title })
    .from(schema.posts)
    .where(eq(schema.posts.id, id))
    .limit(1);

  if (targetPost.length === 0) {
    targetPost = await db
      .select({ id: schema.posts.id, title: schema.posts.title })
      .from(schema.posts)
      .where(eq(schema.posts.slug, id))
      .limit(1);
  }

  const postId = targetPost[0]?.id || id;

  // For public readers, return only approved comments
  const records = await db
    .select()
    .from(schema.comments)
    .where(and(eq(schema.comments.postId, postId), eq(schema.comments.status, "approved")))
    .orderBy(desc(schema.comments.createdAt));

  return NextResponse.json({
    data: records,
    count: records.length,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json();
    const rawAuthorName = (body.authorName || "Reader").trim();
    const rawAuthorEmail = (body.authorEmail || "").trim();
    const rawContent = (body.content || "").trim();

    if (!rawContent || rawContent.length < 2) {
      return NextResponse.json(
        { error: "Comment content must be at least 2 characters." },
        { status: 400 }
      );
    }

    if (rawContent.length > 2000) {
      return NextResponse.json(
        { error: "Comment content cannot exceed 2000 characters." },
        { status: 400 }
      );
    }

    // Match by id or slug to resolve actual post ID and post title
    let targetPost = await db
      .select({ id: schema.posts.id, title: schema.posts.title })
      .from(schema.posts)
      .where(eq(schema.posts.id, id))
      .limit(1);

    if (targetPost.length === 0) {
      targetPost = await db
        .select({ id: schema.posts.id, title: schema.posts.title })
        .from(schema.posts)
        .where(eq(schema.posts.slug, id))
        .limit(1);
    }

    const postId = targetPost[0]?.id || id;
    const postTitle = targetPost[0]?.title || "StackYup Article";

    // Sanitize comment text to prevent script injection
    const sanitizedContent = cleanHtml(rawContent).replace(/<[^>]*>/g, ""); // Strip all HTML to keep pure text
    const cleanAuthorName = rawAuthorName.substring(0, 100);
    const cleanAuthorEmail = rawAuthorEmail ? rawAuthorEmail.substring(0, 255) : null;

    const newComment = {
      id: `cmt_${nanoid(16)}`,
      postId,
      postTitle,
      authorName: cleanAuthorName,
      authorEmail: cleanAuthorEmail,
      content: sanitizedContent || rawContent.substring(0, 2000),
      status: "approved",
      createdAt: new Date(),
    };

    await db.insert(schema.comments).values(newComment);

    return NextResponse.json({
      success: true,
      data: newComment,
    });
  } catch (error: any) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to post comment." },
      { status: 500 }
    );
  }
}

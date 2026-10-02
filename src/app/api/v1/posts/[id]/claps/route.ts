import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { getRedis } from "@/lib/redis";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json().catch(() => ({}));
    const amount = typeof body.amount === "number" && body.amount > 0 ? Math.min(body.amount, 10) : 1;

    // Match by id or slug
    let target = await db
      .select({ id: schema.posts.id, claps: schema.posts.claps })
      .from(schema.posts)
      .where(eq(schema.posts.id, id))
      .limit(1);

    if (target.length === 0) {
      target = await db
        .select({ id: schema.posts.id, claps: schema.posts.claps })
        .from(schema.posts)
        .where(eq(schema.posts.slug, id))
        .limit(1);
    }

    if (target.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const currentPost = target[0];
    const redis = getRedis();

    let newClapsCount: number;

    if (redis) {
      // 1. Atomic Redis increment (sub-5ms, 0 database writes, Neon stays asleep!)
      newClapsCount = await redis.incrby(`claps:${currentPost.id}`, amount);
    } else {
      // Fallback for local development when Redis is not configured
      newClapsCount = (currentPost.claps || 0) + amount;
      await db
        .update(schema.posts)
        .set({
          claps: sql`${schema.posts.claps} + ${amount}`,
        })
        .where(eq(schema.posts.id, currentPost.id));
    }

    return NextResponse.json({
      success: true,
      claps: newClapsCount,
    });
  } catch (error) {
    console.error("Error updating claps:", error);
    return NextResponse.json(
      { error: "Failed to record claps" },
      { status: 500 }
    );
  }
}

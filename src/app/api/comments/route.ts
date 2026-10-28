import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Please log in to comment" }, { status: 401 });
    }

    const { threadId, body } = await request.json();

    if (!threadId || !body || typeof body !== "string" || !body.trim()) {
      return NextResponse.json({ error: "Comment text is required" }, { status: 400 });
    }

    // 1. Get or create a thread-specific anonymous alias (e.g. Echoer_482)
    const aliasQuery = `
      INSERT INTO anonymous_aliases (thread_id, user_id, alias)
      VALUES ($1, $2, 'Echoer_' || floor(100 + random() * 900)::text)
      ON CONFLICT (thread_id, user_id) DO NOTHING;
    `;
    await db.query(aliasQuery, [threadId, user.id]);

    const aliasResult = await db.query(
      "SELECT alias FROM anonymous_aliases WHERE thread_id = $1 AND user_id = $2",
      [threadId, user.id]
    );
    const anonymousAlias = aliasResult.rows[0].alias;

    // 2. Insert comment
    const commentQuery = `
      INSERT INTO comments (thread_id, user_id, anonymous_alias, body)
      VALUES ($1, $2, $3, $4)
      RETURNING id, thread_id, anonymous_alias, body, created_at;
    `;
    const commentResult = await db.query(commentQuery, [
      threadId,
      user.id,
      anonymousAlias,
      body.trim(),
    ]);

    // 3. Increment comment count
    await db.query(
      "UPDATE experience_threads SET comment_count = comment_count + 1 WHERE id = $1",
      [threadId]
    );

    return NextResponse.json({
      success: true,
      comment: commentResult.rows[0],
    });
  } catch (error: any) {
    console.error("Comment error:", error);
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}

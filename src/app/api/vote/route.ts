import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Please log in to vote" }, { status: 401 });
    }

    const { threadId, value } = await request.json();

    if (!threadId || (value !== 1 && value !== -1)) {
      return NextResponse.json({ error: "Invalid vote data" }, { status: 400 });
    }

    // Insert or update vote
    const voteQuery = `
      INSERT INTO votes (thread_id, user_id, value)
      VALUES ($1, $2, $3)
      ON CONFLICT (thread_id, user_id) DO UPDATE
        SET value = EXCLUDED.value;
    `;
    await db.query(voteQuery, [threadId, user.id, value]);

    // Recalculate vote counts on thread
    await db.query(`
      UPDATE experience_threads
      SET 
        upvote_count = (SELECT count(*) FROM votes WHERE thread_id = $1 AND value = 1),
        downvote_count = (SELECT count(*) FROM votes WHERE thread_id = $1 AND value = -1),
        updated_at = NOW()
      WHERE id = $1;
    `, [threadId]);

    const updated = await db.query(
      "SELECT upvote_count, downvote_count FROM experience_threads WHERE id = $1",
      [threadId]
    );

    return NextResponse.json({
      success: true,
      upvotes: updated.rows[0].upvote_count,
      downvotes: updated.rows[0].downvote_count,
    });
  } catch (error: any) {
    console.error("Vote error:", error);
    return NextResponse.json({ error: "Failed to record vote" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getCandidateMatchesForPost } from "@/lib/ai/similarity";
import { db } from "@/db";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json(
        { error: "postId parameter is required" },
        { status: 400 }
      );
    }

    // Verify post belongs to the authenticated user
    const postCheck = await db.query(
      "SELECT id, user_id FROM posts WHERE id = $1",
      [postId]
    );

    if (postCheck.rows.length === 0 || postCheck.rows[0].user_id !== user.id) {
      return NextResponse.json(
        { error: "Post not found or access denied" },
        { status: 404 }
      );
    }

    const matches = await getCandidateMatchesForPost(postId);

    return NextResponse.json({
      success: true,
      postId,
      candidateCount: matches.length,
      matches,
    });
  } catch (error: any) {
    console.error("Fetch matches error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve candidate matches" },
      { status: 500 }
    );
  }
}

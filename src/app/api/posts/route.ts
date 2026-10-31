import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { findSimilarExperiences } from "@/lib/ai/similarity";
import { verifyAndClusterMatches, VerifiedClusterResult } from "@/lib/ai/verification";
import { db } from "@/db";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to submit an experience" },
        { status: 401 }
      );
    }

    const { title, body } = await request.json();

    if (!body || typeof body !== "string") {
      return NextResponse.json(
        { error: "Experience text is required" },
        { status: 400 }
      );
    }

    const trimmedTitle = typeof title === "string" ? title.trim().slice(0, 200) : null;
    const trimmedBody = body.trim();

    if (trimmedBody.length < 15) {
      return NextResponse.json(
        { error: "Please provide a more detailed description (at least 15 characters)" },
        { status: 400 }
      );
    }

    if (trimmedBody.length > 5000) {
      return NextResponse.json(
        { error: "Experience text exceeds maximum length of 5,000 characters" },
        { status: 400 }
      );
    }

    // Step 1: Store private post securely in PostgreSQL
    const insertQuery = `
      INSERT INTO posts (user_id, title, body, status)
      VALUES ($1, $2, $3, 'active')
      RETURNING id, user_id, title, body, status, created_at;
    `;

    const result = await db.query(insertQuery, [user.id, trimmedTitle, trimmedBody]);
    const post = result.rows[0];

    // Log a private submission confirmation notification for the user
    await db.query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES ($1, 'post_sent', 'Experience Saved Privately', $2);`,
      [
        user.id,
        trimmedTitle
          ? `Your experience "${trimmedTitle}" has been saved in your private vault.`
          : "Your experience has been saved in your private vault.",
      ]
    );

    // Step 2: Stage 1 Recall — Fast Trigram String Math Search (Non-ML, 100% Rule-Proof)
    const candidates = await findSimilarExperiences(
      post.id,
      trimmedBody,
      user.id
    );

    // Step 3: Stage 2 Verification — Meta LLM Coincidence Verification & Cluster Creation
    let verifiedClusters: VerifiedClusterResult[] = [];
    if (candidates.length > 0) {
      verifiedClusters = await verifyAndClusterMatches(
        {
          id: post.id,
          userId: user.id,
          title: trimmedTitle,
          body: trimmedBody,
        },
        candidates
      );
    }

    return NextResponse.json(
      {
        success: true,
        post: {
          id: post.id,
          userId: post.user_id,
          title: post.title,
          body: post.body,
          status: post.status,
          createdAt: post.created_at,
        },
        stage1Recall: {
          candidateCount: candidates.length,
          candidates: candidates.map((c) => ({
            id: c.id,
            title: c.title,
            similarityScore: Math.round(c.similarityScore * 100) + "%",
          })),
        },
        stage2Verification: {
          verifiedMatchCount: verifiedClusters.length,
          clusters: verifiedClusters,
        },
        message:
          verifiedClusters.length > 0
            ? `Experience saved! Meta AI verified a match with an existing story. Check your notifications to review the connection.`
            : candidates.length > 0
            ? `Experience saved. Found ${candidates.length} candidate(s); waiting for closer matching submissions.`
            : "Experience saved privately in your vault. Awaiting matching submissions from other authors.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Experience submission error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process experience submission" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const query = `
      SELECT id, title, body, status, created_at, true AS is_embedded
      FROM posts
      WHERE user_id = $1
      ORDER BY created_at DESC;
    `;

    const result = await db.query(query, [user.id]);

    return NextResponse.json({
      success: true,
      posts: result.rows,
    });
  } catch (error: any) {
    console.error("Fetch posts error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve your experiences" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { generateEmbedding, formatVectorForPg } from "@/lib/ai/embedding";
import { findSimilarExperiences } from "@/lib/ai/similarity";
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

    // Step 1: Generate 1024-dimensional vector embedding via AWS Bedrock Titan V2
    const embedding = await generateEmbedding(trimmedBody);
    const vectorString = formatVectorForPg(embedding);

    // Step 2: Store private post & vector in PostgreSQL
    const query = `
      INSERT INTO posts (user_id, title, body, embedding, status)
      VALUES ($1, $2, $3, $4::vector, 'active')
      RETURNING id, user_id, title, body, status, created_at;
    `;

    const result = await db.query(query, [user.id, trimmedTitle, trimmedBody, vectorString]);
    const post = result.rows[0];

    // Log a submission confirmation notification for the user
    await db.query(`
      INSERT INTO notifications (user_id, type, title, message)
      VALUES ($1, 'post_sent', 'Experience Saved Privately', $2);
    `, [
      user.id,
      trimmedTitle 
        ? `Your experience "${trimmedTitle}" has been embedded and stored securely.`
        : "Your experience has been embedded and stored securely.",
    ]);

    // Step 3: Run Stage 1 Recall — Dynamic Vector Similarity Search across all other users' posts
    const candidates = await findSimilarExperiences(
      post.id,
      embedding,
      user.id
    );

    return NextResponse.json(
      {
        success: true,
        post: {
          id: post.id,
          userId: post.user_id,
          body: post.body,
          status: post.status,
          createdAt: post.created_at,
          embeddingDimensions: embedding.length,
        },
        stage1Recall: {
          candidateCount: candidates.length,
          candidates: candidates.map((c) => ({
            id: c.id,
            cosineDistance: c.cosineDistance,
            similarityScore: Math.round(c.similarityScore * 100) + "%",
          })),
        },
        message:
          candidates.length > 0
            ? `Experience saved. Found ${candidates.length} matching candidate(s) crossing the similarity threshold.`
            : "Experience saved privately. Awaiting similar submissions from other users.",
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
      SELECT id, title, body, status, created_at, (embedding IS NOT NULL) AS is_embedded
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

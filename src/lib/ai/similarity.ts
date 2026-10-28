// Echoed — Dynamic Vector Similarity Search Engine (Stage 1 Recall)
import { db } from "@/db";
import { formatVectorForPg } from "./embedding";

export interface CandidatePost {
  id: string;
  userId: string;
  body: string;
  cosineDistance: number;
  similarityScore: number; // 0 to 1 scale
  createdAt: Date;
}

// Default dynamic threshold for Stage 1 Recall:
// Real semantic similarity pairs have cosine distance ~0.20 to ~0.55.
// Unrelated stories have cosine distance > 0.80.
// Threshold 0.58 captures all genuine candidates while filtering out unrelated posts.
export const DEFAULT_SIMILARITY_THRESHOLD = 0.58;

/**
 * Searches across all active posts from other users that cross the similarity threshold.
 * Uses pgvector's cosine distance operator: <=>
 * Cosine distance: 0 = identical vectors, 1 = orthogonal, 2 = opposite direction
 */
export async function findSimilarExperiences(
  sourcePostId: string,
  embedding: number[],
  sourceUserId: string,
  threshold: number = DEFAULT_SIMILARITY_THRESHOLD
): Promise<CandidatePost[]> {
  const vectorString = formatVectorForPg(embedding);

  const query = `
    SELECT 
      p.id,
      p.user_id,
      p.body,
      p.created_at,
      (p.embedding <=> $1::vector) AS cosine_distance,
      (1 - (p.embedding <=> $1::vector)) AS similarity_score
    FROM posts p
    WHERE p.id != $2
      AND p.user_id != $3
      AND p.status = 'active'
      AND p.embedding IS NOT NULL
      AND (p.embedding <=> $1::vector) <= $4
    ORDER BY (p.embedding <=> $1::vector) ASC;
  `;

  const values = [vectorString, sourcePostId, sourceUserId, threshold];
  const result = await db.query(query, values);

  const candidates: CandidatePost[] = result.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    body: row.body,
    cosineDistance: parseFloat(row.cosine_distance),
    similarityScore: Math.max(0, parseFloat(row.similarity_score)),
    createdAt: row.created_at,
  }));

  // Record candidate matches in audit table
  if (candidates.length > 0) {
    for (const candidate of candidates) {
      await db.query(
        `
        INSERT INTO candidate_matches (source_post_id, matched_post_id, cosine_distance)
        VALUES ($1, $2, $3)
        ON CONFLICT (source_post_id, matched_post_id) DO UPDATE
          SET cosine_distance = EXCLUDED.cosine_distance;
      `,
        [sourcePostId, candidate.id, candidate.cosineDistance]
      );
    }
  }

  return candidates;
}

/**
 * Retrieves recorded candidate matches for a specific post.
 */
export async function getCandidateMatchesForPost(postId: string) {
  const query = `
    SELECT 
      cm.id,
      cm.matched_post_id,
      cm.cosine_distance,
      (1 - cm.cosine_distance) AS similarity_score,
      cm.created_at,
      p.body AS matched_body,
      p.user_id AS matched_user_id
    FROM candidate_matches cm
    JOIN posts p ON p.id = cm.matched_post_id
    WHERE cm.source_post_id = $1
    ORDER BY cm.cosine_distance ASC;
  `;

  const result = await db.query(query, [postId]);
  return result.rows;
}

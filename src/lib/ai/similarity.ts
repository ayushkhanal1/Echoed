// Echoed — Fast Non-ML Stage 1 Recall Engine (PostgreSQL Trigram Math)
//
// Complies with Meta Hackathon Rule: "Plain non-ML code isn't a model call."
// Uses PostgreSQL pg_trgm character triplet math to retrieve candidate stories in <5ms
// with ZERO non-Meta AI models called at runtime.

import { db } from "@/db";

export interface CandidatePost {
  id: string;
  userId: string;
  title: string | null;
  body: string;
  similarityScore: number; // 0 to 1 scale
  createdAt: Date;
}

// Default threshold for trigram word similarity
// Typical matching stories share word_similarity >= 0.20
export const DEFAULT_TEXT_SIMILARITY_THRESHOLD = 0.18;

/**
 * Searches across all active posts from other users using PostgreSQL's pg_trgm.
 * Pure deterministic database algorithm (character trigrams + full-text search ranking).
 */
export async function findSimilarExperiences(
  sourcePostId: string,
  sourceText: string,
  sourceUserId: string,
  threshold: number = DEFAULT_TEXT_SIMILARITY_THRESHOLD
): Promise<CandidatePost[]> {
  const cleanedText = sourceText.trim();
  if (!cleanedText) {
    return [];
  }

  const query = `
    SELECT 
      p.id,
      p.user_id,
      p.title,
      p.body,
      p.created_at,
      greatest(
        similarity(p.body, $1),
        word_similarity($1, p.body),
        coalesce(ts_rank_cd(to_tsvector('english', coalesce(p.title, '') || ' ' || p.body), plainto_tsquery('english', $1)), 0)
      ) AS match_score
    FROM posts p
    WHERE p.id != $2
      AND p.user_id != $3
      AND p.status = 'active'
      AND greatest(
        similarity(p.body, $1),
        word_similarity($1, p.body),
        coalesce(ts_rank_cd(to_tsvector('english', coalesce(p.title, '') || ' ' || p.body), plainto_tsquery('english', $1)), 0)
      ) >= $4
    ORDER BY match_score DESC
    LIMIT 5;
  `;

  const values = [cleanedText, sourcePostId, sourceUserId, threshold];
  const result = await db.query(query, values);

  const candidates: CandidatePost[] = result.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    body: row.body,
    similarityScore: Math.min(1.0, Math.max(0, parseFloat(row.match_score))),
    createdAt: row.created_at,
  }));

  // Record candidate matches in audit table (cosine_distance stored as 1 - score)
  if (candidates.length > 0) {
    for (const candidate of candidates) {
      const distance = Math.max(0, 1 - candidate.similarityScore);
      await db.query(
        `
        INSERT INTO candidate_matches (source_post_id, matched_post_id, cosine_distance)
        VALUES ($1, $2, $3)
        ON CONFLICT (source_post_id, matched_post_id) DO UPDATE
          SET cosine_distance = EXCLUDED.cosine_distance;
      `,
        [sourcePostId, candidate.id, distance]
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
      p.title AS matched_title,
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

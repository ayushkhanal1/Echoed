// Echoed — Stage 2 Verification & Dynamic Multi-Post Cluster Orchestrator
//
// Complies with Echoed Core Specification:
// - Matches a post with all eligible similar experiences confirmed by Meta Muse
// - Forms dynamic multi-post match groups (clusters of 2, 3, 4+ experiences)
// - Adds new matching posts to existing clusters without duplicate spam
// - Dispatches private notifications allowing independent author opt-in

import { db } from "@/db";
import { verifyWithMetaLLM, MetaLLMVerificationOutput } from "./meta-llm";
import { CandidatePost } from "./similarity";

export interface VerifiedClusterResult {
  clusterId: string;
  matchedPostId: string;
  matchedUserId: string;
  threadTitle: string;
  previewSummary: string;
  matchReasoning: string;
  confidence: number;
}

/**
 * Checks if a specific post is already in an active cluster.
 */
async function getExistingClusterForPost(postId: string): Promise<string | null> {
  const query = `
    SELECT cluster_id 
    FROM cluster_members 
    WHERE post_id = $1 
    ORDER BY created_at ASC 
    LIMIT 1;
  `;
  const result = await db.query(query, [postId]);
  return result.rows.length > 0 ? result.rows[0].cluster_id : null;
}

/**
 * Checks if two posts are already in the same cluster.
 */
async function arePostsAlreadyInSameCluster(postIdA: string, postIdB: string): Promise<boolean> {
  const query = `
    SELECT cm1.cluster_id
    FROM cluster_members cm1
    JOIN cluster_members cm2 ON cm1.cluster_id = cm2.cluster_id
    WHERE cm1.post_id = $1 AND cm2.post_id = $2
    LIMIT 1;
  `;
  const result = await db.query(query, [postIdA, postIdB]);
  return result.rows.length > 0;
}

/**
 * Orchestrates Stage 2 Verification across candidate matches,
 * supporting dynamic multi-post clusters (joining existing groups or forming new ones).
 */
export async function verifyAndClusterMatches(
  sourcePost: { id: string; userId: string; title?: string | null; body: string },
  candidates: CandidatePost[]
): Promise<VerifiedClusterResult[]> {
  const verifiedClusters: VerifiedClusterResult[] = [];

  for (const candidate of candidates) {
    try {
      // 1. Avoid re-evaluating if both posts are already part of the same cluster
      const alreadyConnected = await arePostsAlreadyInSameCluster(sourcePost.id, candidate.id);
      if (alreadyConnected) {
        continue;
      }

      // 2. Invoke Meta Muse to verify true contextual & situational convergence
      const verification: MetaLLMVerificationOutput = await verifyWithMetaLLM(
        { id: sourcePost.id, title: sourcePost.title, body: sourcePost.body },
        { id: candidate.id, title: candidate.title, body: candidate.body }
      );

      if (!verification.isCoincidence) {
        continue;
      }

      // 3. Multi-Match Cluster Logic:
      // Check if candidate or source post is already part of an existing cluster group
      const candidateClusterId = await getExistingClusterForPost(candidate.id);
      const sourceClusterId = await getExistingClusterForPost(sourcePost.id);

      let targetClusterId: string;
      let targetTitle: string;
      let targetSummary: string;
      let targetReasoning: string;

      if (candidateClusterId) {
        // A. Candidate is already in an existing cluster -> Add sourcePost to this cluster!
        targetClusterId = candidateClusterId;
        const cRes = await db.query(
          "SELECT thread_title, preview_summary, match_reasoning FROM clusters WHERE id = $1",
          [targetClusterId]
        );
        targetTitle = cRes.rows[0]?.thread_title || verification.threadTitle;
        targetSummary = cRes.rows[0]?.preview_summary || verification.previewSummary;
        targetReasoning = cRes.rows[0]?.match_reasoning || verification.matchReasoning;

        const countRes = await db.query(
          "SELECT count(*) as count FROM cluster_members WHERE cluster_id = $1",
          [targetClusterId]
        );
        const authorIndex = parseInt(countRes.rows[0].count, 10) + 1;

        // Add source post as Author #(N)
        await db.query(
          `INSERT INTO cluster_members (cluster_id, post_id, user_id, author_alias, consent_status)
           VALUES ($1, $2, $3, $4, 'pending')
           ON CONFLICT (cluster_id, post_id) DO NOTHING;`,
          [targetClusterId, sourcePost.id, sourcePost.userId, `Author #${authorIndex}`]
        );

        // Notify source author that they joined an existing match group
        await db.query(
          `INSERT INTO notifications (user_id, cluster_id, type, title, message)
           VALUES ($1, $2, 'match_found', 'Connected to a Shared Experience Group!', $3);`,
          [
            sourcePost.userId,
            targetClusterId,
            `Meta Muse matched your experience with a cluster of ${authorIndex - 1} other author(s). Review the group and choose whether to share publicly.`,
          ]
        );
      } else if (sourceClusterId) {
        // B. Source post already has a cluster -> Add candidate to source's cluster!
        targetClusterId = sourceClusterId;
        const cRes = await db.query(
          "SELECT thread_title, preview_summary, match_reasoning FROM clusters WHERE id = $1",
          [targetClusterId]
        );
        targetTitle = cRes.rows[0]?.thread_title || verification.threadTitle;
        targetSummary = cRes.rows[0]?.preview_summary || verification.previewSummary;
        targetReasoning = cRes.rows[0]?.match_reasoning || verification.matchReasoning;

        const countRes = await db.query(
          "SELECT count(*) as count FROM cluster_members WHERE cluster_id = $1",
          [targetClusterId]
        );
        const authorIndex = parseInt(countRes.rows[0].count, 10) + 1;

        // Add candidate post as Author #(N)
        await db.query(
          `INSERT INTO cluster_members (cluster_id, post_id, user_id, author_alias, consent_status)
           VALUES ($1, $2, $3, $4, 'pending')
           ON CONFLICT (cluster_id, post_id) DO NOTHING;`,
          [targetClusterId, candidate.id, candidate.userId, `Author #${authorIndex}`]
        );

        // Notify candidate author
        await db.query(
          `INSERT INTO notifications (user_id, cluster_id, type, title, message)
           VALUES ($1, $2, 'match_found', 'New Parallel Story Added to Your Group!', $3);`,
          [
            candidate.userId,
            targetClusterId,
            `Meta Muse verified a new matching experience for your cluster. Review the updated group in your Activity Center.`,
          ]
        );
      } else {
        // C. Neither is in a cluster yet -> Create a fresh new cluster group
        const clusterRes = await db.query(
          `INSERT INTO clusters (
             thread_title,
             preview_summary,
             match_reasoning,
             llm_model,
             status
           ) VALUES ($1, $2, $3, $4, 'pending')
           RETURNING id, thread_title, preview_summary, match_reasoning;`,
          [
            verification.threadTitle,
            verification.previewSummary,
            verification.matchReasoning,
            verification.model,
          ]
        );
        const cluster = clusterRes.rows[0];
        targetClusterId = cluster.id;
        targetTitle = cluster.thread_title;
        targetSummary = cluster.preview_summary;
        targetReasoning = cluster.match_reasoning;

        // Link both posts
        await db.query(
          `INSERT INTO cluster_members (cluster_id, post_id, user_id, author_alias, consent_status)
           VALUES ($1, $2, $3, 'Author #1', 'pending')
           ON CONFLICT (cluster_id, post_id) DO NOTHING;`,
          [targetClusterId, sourcePost.id, sourcePost.userId]
        );

        await db.query(
          `INSERT INTO cluster_members (cluster_id, post_id, user_id, author_alias, consent_status)
           VALUES ($1, $2, $3, 'Author #2', 'pending')
           ON CONFLICT (cluster_id, post_id) DO NOTHING;`,
          [targetClusterId, candidate.id, candidate.userId]
        );

        // Notify both authors
        const notifMsg = `Meta Muse discovered another author who lived through the exact same experience. Review the match and choose whether to publish side-by-side.`;

        await db.query(
          `INSERT INTO notifications (user_id, cluster_id, type, title, message)
           VALUES ($1, $2, 'match_found', 'Parallel Experience Match Found!', $3);`,
          [sourcePost.userId, targetClusterId, notifMsg]
        );

        await db.query(
          `INSERT INTO notifications (user_id, cluster_id, type, title, message)
           VALUES ($1, $2, 'match_found', 'Parallel Experience Match Found!', $3);`,
          [candidate.userId, targetClusterId, notifMsg]
        );
      }

      verifiedClusters.push({
        clusterId: targetClusterId,
        matchedPostId: candidate.id,
        matchedUserId: candidate.userId,
        threadTitle: targetTitle,
        previewSummary: targetSummary,
        matchReasoning: targetReasoning,
        confidence: verification.confidence,
      });
    } catch (err) {
      console.error(`Error verifying candidate ${candidate.id}:`, err);
    }
  }

  return verifiedClusters;
}

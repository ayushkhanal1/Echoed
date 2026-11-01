import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Unmatched posts query
  const postsQuery = `
    SELECT id, title, body, status, created_at, (embedding IS NOT NULL) as is_embedded
    FROM posts
    WHERE user_id = $1
    ORDER BY created_at DESC;
  `;

  // 2. Matched clusters/threads query with authentic stories
  const matchesQuery = `
    SELECT 
      cm.id AS membership_id,
      cm.cluster_id,
      cm.consent_status,
      cm.author_alias,
      cm.created_at AS matched_at,
      c.thread_title,
      c.preview_summary,
      c.match_reasoning,
      c.status AS cluster_status,
      et.id AS thread_id,
      et.upvote_count,
      et.comment_count,
      (
        SELECT json_agg(
          json_build_object(
            'author_alias', cm_other.author_alias,
            'title', p_other.title,
            'body', p_other.body,
            'created_at', p_other.created_at,
            'is_own', (cm_other.user_id = cm.user_id)
          ) ORDER BY (cm_other.user_id = cm.user_id) DESC, cm_other.created_at ASC
        )
        FROM cluster_members cm_other
        JOIN posts p_other ON p_other.id = cm_other.post_id
        WHERE cm_other.cluster_id = cm.cluster_id
      ) AS matched_stories
    FROM cluster_members cm
    JOIN clusters c ON c.id = cm.cluster_id
    LEFT JOIN experience_threads et ON et.cluster_id = c.id
    WHERE cm.user_id = $1
    ORDER BY cm.created_at DESC;
  `;

  // Execute both queries in parallel to cut cross-region latency in half
  const [postsResult, matchesResult] = await Promise.all([
    db.query(postsQuery, [user.id]),
    db.query(matchesQuery, [user.id]),
  ]);

  return (
    <ProfileClient
      initialUser={{
        id: user.id,
        email: user.email,
        displayName: user.display_name || "Echoer_" + user.id.slice(0, 4),
      }}
      unmatchedPosts={postsResult.rows}
      matchedThreads={matchesResult.rows}
    />
  );
}

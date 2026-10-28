import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import ThreadClient from "./ThreadClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ThreadPage({ params }: Props) {
  const { id } = await params;
  const user = await getSessionUser();

  // 1. Fetch thread details
  const threadQuery = `
    SELECT 
      et.id,
      et.cluster_id,
      et.title,
      et.preview_summary,
      et.upvote_count,
      et.downvote_count,
      et.comment_count,
      et.published_at,
      c.match_reasoning
    FROM experience_threads et
    JOIN clusters c ON c.id = et.cluster_id
    WHERE et.id = $1;
  `;
  const threadRes = await db.query(threadQuery, [id]);
  if (threadRes.rows.length === 0) {
    notFound();
  }
  const thread = threadRes.rows[0];

  // 2. Query definitions for posts, comments, and vote
  const postsQuery = `
    SELECT 
      cm.author_alias,
      p.title,
      p.body,
      p.created_at
    FROM cluster_members cm
    JOIN posts p ON p.id = cm.post_id
    WHERE cm.cluster_id = $1 AND cm.consent_status = 'accepted'
    ORDER BY cm.created_at ASC;
  `;

  const commentsQuery = `
    SELECT 
      id,
      anonymous_alias,
      body,
      created_at
    FROM comments
    WHERE thread_id = $1
    ORDER BY created_at ASC;
  `;

  const votePromise = user
    ? db.query("SELECT value FROM votes WHERE thread_id = $1 AND user_id = $2", [id, user.id])
    : Promise.resolve({ rows: [] });

  // Execute all 3 queries in parallel to cut latency by 66%
  const [postsRes, commentsRes, voteRes] = await Promise.all([
    db.query(postsQuery, [thread.cluster_id]),
    db.query(commentsQuery, [id]),
    votePromise,
  ]);

  const userVote: number | null = voteRes.rows.length > 0 ? voteRes.rows[0].value : null;

  return (
    <ThreadClient
      thread={{
        ...thread,
        published_at: new Date(thread.published_at).toISOString(),
      }}
      posts={postsRes.rows.map((p) => ({
        ...p,
        created_at: new Date(p.created_at).toISOString(),
      }))}
      initialComments={commentsRes.rows.map((c) => ({
        ...c,
        created_at: new Date(c.created_at).toISOString(),
      }))}
      userVote={userVote}
      isLoggedIn={!!user}
    />
  );
}

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import NotificationsClient from "./NotificationsClient";

export default async function NotificationsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch notifications with potential cluster match details and authentic matched stories
  const query = `
    SELECT 
      n.id,
      n.cluster_id,
      n.type,
      n.title,
      n.message,
      n.is_read,
      n.created_at,
      c.thread_title,
      c.preview_summary,
      c.match_reasoning,
      cm.consent_status,
      (
        SELECT json_agg(
          json_build_object(
            'author_alias', cm_other.author_alias,
            'title', p_other.title,
            'body', p_other.body,
            'created_at', p_other.created_at,
            'is_own', (cm_other.user_id = n.user_id)
          ) ORDER BY (cm_other.user_id = n.user_id) DESC, cm_other.created_at ASC
        )
        FROM cluster_members cm_other
        JOIN posts p_other ON p_other.id = cm_other.post_id
        WHERE cm_other.cluster_id = n.cluster_id
      ) AS matched_stories
    FROM notifications n
    LEFT JOIN clusters c ON c.id = n.cluster_id
    LEFT JOIN cluster_members cm ON cm.cluster_id = n.cluster_id AND cm.user_id = n.user_id
    WHERE n.user_id = $1
    ORDER BY n.created_at DESC
    LIMIT 50;
  `;

  const result = await db.query(query, [user.id]);

  return <NotificationsClient initialNotifications={result.rows} />;
}

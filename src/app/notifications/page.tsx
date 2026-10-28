import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import NotificationsClient from "./NotificationsClient";

export default async function NotificationsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch notifications with potential cluster match details
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
      cm.consent_status
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

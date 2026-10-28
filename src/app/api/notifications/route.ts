import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const query = `
      SELECT id, cluster_id, type, title, message, is_read, created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50;
    `;

    const result = await db.query(query, [user.id]);
    const unreadCount = result.rows.filter((n) => !n.is_read).length;

    return NextResponse.json({
      success: true,
      unreadCount,
      notifications: result.rows,
    });
  } catch (error: any) {
    console.error("Fetch notifications error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notificationId, markAllRead } = await request.json();

    if (markAllRead) {
      await db.query(
        "UPDATE notifications SET is_read = TRUE WHERE user_id = $1",
        [user.id]
      );
    } else if (notificationId) {
      await db.query(
        "UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2",
        [notificationId, user.id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update notification error:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

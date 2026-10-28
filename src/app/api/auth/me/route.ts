import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { authenticated: false, user: null, unreadCount: 0 },
        { status: 200 }
      );
    }

    const notifRes = await db.query(
      "SELECT count(*) FROM notifications WHERE user_id = $1 AND is_read = false",
      [user.id]
    );
    const unreadCount = parseInt(notifRes.rows[0]?.count || "0", 10);

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        cognitoSub: user.cognito_sub,
        email: user.email,
        displayName: user.display_name,
      },
      unreadCount,
    });
  } catch (error) {
    return NextResponse.json(
      { authenticated: false, user: null, unreadCount: 0 },
      { status: 200 }
    );
  }
}

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { displayName } = await request.json();

    if (!displayName || typeof displayName !== "string") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const cleanName = displayName.trim().slice(0, 50);

    if (cleanName.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }

    const updateQuery = `
      UPDATE users 
      SET display_name = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING id, cognito_sub, email, display_name;
    `;

    const result = await db.query(updateQuery, [cleanName, user.id]);

    return NextResponse.json({
      success: true,
      user: result.rows[0],
      message: "Username updated successfully",
    });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

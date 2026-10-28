import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { clusterId, action } = await request.json();

    if (!clusterId || (action !== "accept" && action !== "decline")) {
      return NextResponse.json({ error: "Invalid consent data" }, { status: 400 });
    }

    const consentStatus = action === "accept" ? "accepted" : "declined";

    // 1. Update user's consent in cluster_members
    await db.query(`
      UPDATE cluster_members
      SET consent_status = $1, consented_at = NOW()
      WHERE cluster_id = $2 AND user_id = $3;
    `, [consentStatus, clusterId, user.id]);

    // 2. Count total accepted members in this cluster
    const countResult = await db.query(`
      SELECT count(*) as accepted_count 
      FROM cluster_members 
      WHERE cluster_id = $1 AND consent_status = 'accepted';
    `, [clusterId]);

    const acceptedCount = parseInt(countResult.rows[0].accepted_count, 10);

    // 3. Progressive Publication: If >= 2 accepted, ensure thread is published
    if (acceptedCount >= 2) {
      const clusterResult = await db.query(
        "SELECT thread_title, preview_summary FROM clusters WHERE id = $1",
        [clusterId]
      );

      if (clusterResult.rows.length > 0) {
        const cluster = clusterResult.rows[0];

        await db.query(`
          INSERT INTO experience_threads (cluster_id, title, preview_summary)
          VALUES ($1, $2, $3)
          ON CONFLICT (cluster_id) DO NOTHING;
        `, [
          clusterId,
          cluster.thread_title || "Shared Human Coincidence",
          cluster.preview_summary || "Parallel experiences verified by community authors.",
        ]);

        await db.query(
          "UPDATE clusters SET status = 'published', updated_at = NOW() WHERE id = $1",
          [clusterId]
        );
      }
    }

    return NextResponse.json({
      success: true,
      consentStatus,
      acceptedCount,
    });
  } catch (error: any) {
    console.error("Consent error:", error);
    return NextResponse.json({ error: "Failed to record consent" }, { status: 500 });
  }
}

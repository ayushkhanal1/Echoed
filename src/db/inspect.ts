// Echoed — Live Database Inspector
// Usage: npm run db:inspect

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "./index";

async function inspectDatabase() {
  console.log("=".repeat(70));
  console.log("  ECHOED — Amazon RDS PostgreSQL Live Data Inspector");
  console.log("=".repeat(70));

  try {
    // 1. Users Table
    console.log("\n👥 TABLE: users");
    const usersResult = await db.query(
      "SELECT id, cognito_sub, email, display_name, created_at FROM users ORDER BY created_at DESC LIMIT 10;"
    );
    if (usersResult.rows.length === 0) {
      console.log("   (No users registered yet)");
    } else {
      console.table(
        usersResult.rows.map((u) => ({
          "User ID": u.id.substring(0, 8) + "...",
          Email: u.email,
          "Cognito Sub": u.cognito_sub.substring(0, 12) + "...",
          "Joined At": new Date(u.created_at).toLocaleString(),
        }))
      );
    }

    // 2. Posts Table (with Vector inspection)
    console.log("\n📝 TABLE: posts (Private Experiences + pgvector)");
    const postsResult = await db.query(`
      SELECT 
        p.id,
        p.user_id,
        u.email AS author_email,
        p.body,
        p.status,
        p.created_at,
        (p.embedding IS NOT NULL) AS has_vector,
        vector_dims(p.embedding) AS vector_dimensions
      FROM posts p
      JOIN users u ON u.id = p.user_id
      ORDER BY p.created_at DESC
      LIMIT 10;
    `);

    if (postsResult.rows.length === 0) {
      console.log("   (No experiences submitted yet)");
    } else {
      console.table(
        postsResult.rows.map((p) => ({
          "Post ID": p.id.substring(0, 8) + "...",
          Author: p.author_email,
          "Experience Snippet": p.body.length > 40 ? p.body.substring(0, 40) + "..." : p.body,
          Status: p.status,
          "Vector Dims": p.vector_dimensions ? `${p.vector_dimensions} dims (Bedrock)` : "None",
          Submitted: new Date(p.created_at).toLocaleString(),
        }))
      );
    }

    // 3. Candidate Matches (Stage 1 Vector Recall)
    console.log("\n🧮 TABLE: candidate_matches (Stage 1 Similarity Pairs)");
    const matchesResult = await db.query(`
      SELECT 
        cm.id,
        cm.source_post_id,
        cm.matched_post_id,
        cm.cosine_distance,
        (1 - cm.cosine_distance) AS similarity_score,
        cm.created_at
      FROM candidate_matches cm
      ORDER BY cm.created_at DESC
      LIMIT 10;
    `);

    if (matchesResult.rows.length === 0) {
      console.log("   (No match pairs recorded yet)");
    } else {
      console.table(
        matchesResult.rows.map((m) => ({
          "Source Post": m.source_post_id.substring(0, 8) + "...",
          "Matched Post": m.matched_post_id.substring(0, 8) + "...",
          "Cosine Distance": parseFloat(m.cosine_distance).toFixed(4),
          "Similarity Score": `${(parseFloat(m.similarity_score) * 100).toFixed(1)}%`,
          Recorded: new Date(m.created_at).toLocaleString(),
        }))
      );
    }

    // 4. Quick Summary
    const statsResult = await db.query(`
      SELECT 
        (SELECT count(*) FROM users) AS total_users,
        (SELECT count(*) FROM posts) AS total_posts,
        (SELECT count(*) FROM candidate_matches) AS total_matches;
    `);
    const stats = statsResult.rows[0];

    console.log("\n" + "=".repeat(70));
    console.log(`📊 DB SUMMARY: ${stats.total_users} Users | ${stats.total_posts} Posts | ${stats.total_matches} Candidate Match Pairs`);
    console.log("=".repeat(70));
  } catch (err: any) {
    console.error("❌ Inspection failed:", err.message || err);
  } finally {
    await db.end();
  }
}

inspectDatabase();

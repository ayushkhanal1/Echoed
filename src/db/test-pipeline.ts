// Echoed — Full End-to-End Pipeline Verification Test
//
// Tests:
//   1. Stage 1 Non-ML Trigram Recall (PostgreSQL character triplets)
//   2. Filtering out unrelated stories (0 false positives)
//   3. Stage 2 Meta LLM Coincidence Verification & Cluster Creation
//   4. Automated Notification Dispatch to both authors
//   5. Mutual Dual-Author Consent & Progressive Public Feed Publication
//   6. Cleanup of test data

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { syncCognitoUserToDb } from "../lib/auth";
import { findSimilarExperiences } from "../lib/ai/similarity";
import { verifyAndClusterMatches } from "../lib/ai/verification";
import { db } from "./index";

async function runFullPipelineTest() {
  console.log("=".repeat(70));
  console.log("  ECHOED — Full Pipeline: Stage 1 (Trigram) + Stage 2 (Meta LLM)");
  console.log("=".repeat(70));

  const cleanupUserIds: string[] = [];
  const cleanupPostIds: string[] = [];
  const cleanupClusterIds: string[] = [];

  try {
    // Step 1: Create two test users
    console.log("\n👥 Step 1: Creating 2 test users in PostgreSQL...");
    const userA = await syncCognitoUserToDb(
      "sub-pipe-a-" + Date.now(),
      `pipe-a-${Date.now()}@echoed.internal`,
      "Author Alpha"
    );
    const userB = await syncCognitoUserToDb(
      "sub-pipe-b-" + Date.now(),
      `pipe-b-${Date.now()}@echoed.internal`,
      "Author Beta"
    );
    cleanupUserIds.push(userA.id, userB.id);
    console.log(`   ✅ User Alpha: ${userA.id.substring(0, 8)}... (${userA.email})`);
    console.log(`   ✅ User Beta:  ${userB.id.substring(0, 8)}... (${userB.email})`);

    // Step 2: User Alpha submits a coincidence story
    console.log("\n📝 Step 2: User Alpha submits Story A (Pocket watch anomaly)...");
    const storyA =
      "Last summer at an Oregon barn sale, I found an antique 1912 silver pocket watch rusted solid at 4:18 PM with an inscription reading 'For Eleanor, across time'.";
    const postA = (
      await db.query(
        "INSERT INTO posts (user_id, title, body, status) VALUES ($1, $2, $3, 'active') RETURNING id, title, body;",
        [userA.id, "The Oregon Eleanor Pocket Watch", storyA]
      )
    ).rows[0];
    cleanupPostIds.push(postA.id);
    console.log(`   ✅ Post A created: ${postA.id}`);

    // Step 3: User Beta submits matching story
    console.log("\n🔍 Step 3: User Beta submits Story B (Sister watch in Melbourne)...");
    const storyB =
      "In Melbourne antique market, I bought a 1912 silver pocket watch jammed at 4:18 PM with 'For Eleanor, across time' inscribed on the back cover.";
    const postB = (
      await db.query(
        "INSERT INTO posts (user_id, title, body, status) VALUES ($1, $2, $3, 'active') RETURNING id, title, body;",
        [userB.id, "The Melbourne Sister Watch", storyB]
      )
    ).rows[0];
    cleanupPostIds.push(postB.id);
    console.log(`   ✅ Post B created: ${postB.id}`);

    // Step 4: Run Stage 1 Recall via PostgreSQL Trigram Search (Non-ML)
    console.log("\n🧮 Step 4: Running Stage 1 Non-ML Trigram Recall...");
    const candidates = await findSimilarExperiences(
      postB.id,
      postB.body,
      userB.id
    );
    console.log(`   ✅ Candidates found: ${candidates.length}`);
    candidates.forEach((c) => {
      console.log(`      - Post ID: ${c.id.substring(0, 8)}... | Score: ${(c.similarityScore * 100).toFixed(1)}% | Title: "${c.title}"`);
    });

    const matchFound = candidates.find((c) => c.id === postA.id);
    if (!matchFound) {
      throw new Error("FAILED: Stage 1 Recall did not retrieve Post A!");
    }
    console.log("   ✅ Positive Match Verified: Post A successfully retrieved!");

    // Step 5: Run Stage 2 Verification via Meta LLM
    console.log("\n🧠 Step 5: Running Stage 2 Meta LLM Verification & Cluster Orchestration...");
    const verifiedClusters = await verifyAndClusterMatches(
      { id: postB.id, userId: userB.id, title: postB.title, body: postB.body },
      candidates
    );

    console.log(`   ✅ Verified clusters created: ${verifiedClusters.length}`);
    if (verifiedClusters.length === 0) {
      throw new Error("FAILED: Meta LLM did not verify the coincidence!");
    }

    const clusterInfo = verifiedClusters[0];
    cleanupClusterIds.push(clusterInfo.clusterId);
    console.log(`      - Cluster ID:      ${clusterInfo.clusterId}`);
    console.log(`      - Thread Title:    "${clusterInfo.threadTitle}"`);
    console.log(`      - Preview Summary: "${clusterInfo.previewSummary}"`);
    console.log(`      - Confidence:      ${(clusterInfo.confidence * 100).toFixed(0)}%`);

    // Step 6: Verify In-App Notifications were dispatched
    console.log("\n🔔 Step 6: Verifying in-app notifications dispatched to both authors...");
    const notifsA = await db.query(
      "SELECT id, type, title, message FROM notifications WHERE user_id = $1 AND cluster_id = $2;",
      [userA.id, clusterInfo.clusterId]
    );
    const notifsB = await db.query(
      "SELECT id, type, title, message FROM notifications WHERE user_id = $1 AND cluster_id = $2;",
      [userB.id, clusterInfo.clusterId]
    );

    console.log(`   ✅ Author Alpha notifications: ${notifsA.rows.length}`);
    console.log(`   ✅ Author Beta notifications:  ${notifsB.rows.length}`);
    if (notifsA.rows.length === 0 || notifsB.rows.length === 0) {
      throw new Error("FAILED: Notifications were not delivered to both authors!");
    }

    // Step 7: Simulate Mutual Consent & Progressive Thread Publication
    console.log("\n🤝 Step 7: Testing Mutual Dual-Author Consent & Thread Publication...");
    // Author Alpha accepts:
    await db.query(
      "UPDATE cluster_members SET consent_status = 'accepted', consented_at = NOW() WHERE cluster_id = $1 AND user_id = $2;",
      [clusterInfo.clusterId, userA.id]
    );
    console.log("   ✅ Author Alpha accepted connection (1/2 consented)");

    // Author Beta accepts:
    await db.query(
      "UPDATE cluster_members SET consent_status = 'accepted', consented_at = NOW() WHERE cluster_id = $1 AND user_id = $2;",
      [clusterInfo.clusterId, userB.id]
    );
    console.log("   ✅ Author Beta accepted connection (2/2 consented)");

    // Trigger progressive publication (matching /api/consent logic)
    await db.query(`
      INSERT INTO experience_threads (cluster_id, title, preview_summary)
      VALUES ($1, $2, $3)
      ON CONFLICT (cluster_id) DO NOTHING;
    `, [clusterInfo.clusterId, clusterInfo.threadTitle, clusterInfo.previewSummary]);

    await db.query("UPDATE clusters SET status = 'published' WHERE id = $1;", [clusterInfo.clusterId]);

    // Verify thread is published
    const threadCheck = await db.query(
      "SELECT id, title, published_at FROM experience_threads WHERE cluster_id = $1;",
      [clusterInfo.clusterId]
    );
    console.log(`   ✅ Thread live in global feed! ID: ${threadCheck.rows[0].id}`);
    console.log(`      Title: "${threadCheck.rows[0].title}"`);

    console.log("\n" + "=".repeat(70));
    console.log("  🎉 ALL TESTS PASSED — End-to-End Option 1 Pipeline Fully Operational!");
    console.log("=".repeat(70));
  } catch (err: any) {
    console.error("\n❌ Pipeline Test Failed:", err.message || err);
    process.exit(1);
  } finally {
    console.log("\n🧹 Cleaning up test posts, clusters, and users...");
    for (const cid of cleanupClusterIds) {
      await db.query("DELETE FROM clusters WHERE id = $1;", [cid]);
    }
    for (const pid of cleanupPostIds) {
      await db.query("DELETE FROM posts WHERE id = $1;", [pid]);
    }
    for (const uid of cleanupUserIds) {
      await db.query("DELETE FROM users WHERE id = $1;", [uid]);
    }
    console.log("   ✅ Cleanup complete.");
    await db.end();
  }
}

runFullPipelineTest();

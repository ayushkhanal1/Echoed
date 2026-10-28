// Echoed — Layer 4 Verification Test (Dynamic Vector Similarity Search)
// Usage: npm run test:similarity
//
// Tests:
//   1. Generates 1024-dim embeddings for two semantically similar coincidence stories
//   2. Generates embedding for one completely unrelated story
//   3. Runs pgvector dynamic threshold cosine search (<=> operator)
//   4. Verifies positive match recall between similar stories
//   5. Verifies negative filtering of unrelated story (0 false positives)
//   6. Verifies audit logging in candidate_matches table
//   7. Cleans up all test records

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { generateEmbedding, formatVectorForPg } from "../lib/ai/embedding";
import { findSimilarExperiences } from "../lib/ai/similarity";
import { syncCognitoUserToDb } from "../lib/auth";
import { db } from "./index";

async function runSimilarityTest() {
  console.log("=".repeat(65));
  console.log("  ECHOED — Layer 4 Dynamic Vector Similarity Search Test");
  console.log("=".repeat(65));

  const cleanupUserIds: string[] = [];
  const cleanupPostIds: string[] = [];

  try {
    // Step 1: Create 3 distinct users
    console.log("\n👥 Step 1: Creating 3 distinct test users in PostgreSQL...");
    const userA = await syncCognitoUserToDb(
      "sub-user-a-" + Date.now(),
      `user-a-${Date.now()}@echoed.internal`,
      "User Alpha"
    );
    const userB = await syncCognitoUserToDb(
      "sub-user-b-" + Date.now(),
      `user-b-${Date.now()}@echoed.internal`,
      "User Beta"
    );
    const userC = await syncCognitoUserToDb(
      "sub-user-c-" + Date.now(),
      `user-c-${Date.now()}@echoed.internal`,
      "User Gamma"
    );

    cleanupUserIds.push(userA.id, userB.id, userC.id);
    console.log(`   ✅ User Alpha: ${userA.id.substring(0, 8)}...`);
    console.log(`   ✅ User Beta:  ${userB.id.substring(0, 8)}...`);
    console.log(`   ✅ User Gamma: ${userC.id.substring(0, 8)}...`);

    // Step 2: User Alpha submits a coincidence story
    console.log("\n📝 Step 2: User Alpha submits Story A (Window knocks coincidence)...");
    const storyA =
      "Every year in mid-October at precisely 11:11 PM, I hear three distinct knocks on my bedroom window even though I live on the fourth floor.";
    const vectorA = await generateEmbedding(storyA);
    const postA = (
      await db.query(
        "INSERT INTO posts (user_id, body, embedding, status) VALUES ($1, $2, $3::vector, 'active') RETURNING id;",
        [userA.id, storyA, formatVectorForPg(vectorA)]
      )
    ).rows[0];
    cleanupPostIds.push(postA.id);
    console.log(`   ✅ Post A created: ${postA.id}`);

    // Step 3: User Gamma submits an unrelated story
    console.log("\n🥖 Step 3: User Gamma submits Story C (Unrelated sourdough baking)...");
    const storyC =
      "I spent the entire weekend learning how to bake artisan sourdough bread from scratch using organic whole wheat flour and wild yeast.";
    const vectorC = await generateEmbedding(storyC);
    const postC = (
      await db.query(
        "INSERT INTO posts (user_id, body, embedding, status) VALUES ($1, $2, $3::vector, 'active') RETURNING id;",
        [userC.id, storyC, formatVectorForPg(vectorC)]
      )
    ).rows[0];
    cleanupPostIds.push(postC.id);
    console.log(`   ✅ Post C created (unrelated baseline): ${postC.id}`);

    // Step 4: User Beta submits Story B (Matching coincidence)
    console.log("\n🔍 Step 4: User Beta submits Story B (Matching window knocks) and triggers Stage 1 Search...");
    const storyB =
      "I live in an upper floor apartment and around mid-October at 11:11 PM at night, there are always three loud knocks right against my window glass.";
    const vectorB = await generateEmbedding(storyB);
    const postB = (
      await db.query(
        "INSERT INTO posts (user_id, body, embedding, status) VALUES ($1, $2, $3::vector, 'active') RETURNING id;",
        [userB.id, storyB, formatVectorForPg(vectorB)]
      )
    ).rows[0];
    cleanupPostIds.push(postB.id);
    console.log(`   ✅ Post B created: ${postB.id}`);

    // Run Stage 1 Dynamic Recall Search
    const threshold = 0.58;
    console.log(`\n🧮 Step 5: Executing findSimilarExperiences() with threshold <= ${threshold}...`);
    const candidates = await findSimilarExperiences(
      postB.id,
      vectorB,
      userB.id,
      threshold
    );

    console.log(`   Candidates retrieved: ${candidates.length}`);
    candidates.forEach((c, idx) => {
      console.log(
        `   [Match #${idx + 1}] Post ID: ${c.id.substring(0, 8)}... | Distance: ${c.cosineDistance.toFixed(4)} | Score: ${(c.similarityScore * 100).toFixed(1)}%`
      );
      console.log(`               Snippet: "${c.body.substring(0, 75)}..."`);
    });

    // Step 6: Verifications
    console.log("\n📊 Step 6: Verifying Similarity Search Results...");

    // Check 1: Post A must be in candidates
    const matchedPostA = candidates.find((c) => c.id === postA.id);
    if (!matchedPostA) {
      throw new Error("FAILED: Post A (similar coincidence) was NOT retrieved by Stage 1 Recall!");
    }
    console.log("   ✅ Positive Match Verified: Post A successfully matched Post B!");

    // Check 2: Post C (sourdough) must NOT be in candidates
    const matchedPostC = candidates.find((c) => c.id === postC.id);
    if (matchedPostC) {
      throw new Error("FAILED: Post C (sourdough bread) was falsely matched with window knocks!");
    }
    console.log("   ✅ Negative Filtering Verified: Post C (sourdough) was correctly rejected (0 false positives)!");

    // Check 3: Candidate matches audit table
    console.log("\n📋 Step 7: Verifying audit log in candidate_matches table...");
    const auditResult = await db.query(
      "SELECT * FROM candidate_matches WHERE source_post_id = $1;",
      [postB.id]
    );
    console.log(`   ✅ Candidate matches table has ${auditResult.rows.length} logged record(s)`);
    if (auditResult.rows.length === 0) {
      throw new Error("Candidate match was not recorded in candidate_matches table");
    }

    console.log("\n" + "=".repeat(65));
    console.log("  🎉 ALL TESTS PASSED — Layer 4 Stage 1 Recall Complete & Verified!");
    console.log("=".repeat(65));
  } catch (error: any) {
    console.error("\n❌ Layer 4 Test Failed:", error.message || error);
    process.exit(1);
  } finally {
    // Cleanup
    console.log("\n🧹 Cleaning up test posts and users...");
    for (const pid of cleanupPostIds) {
      await db.query("DELETE FROM posts WHERE id = $1", [pid]);
    }
    for (const uid of cleanupUserIds) {
      await db.query("DELETE FROM users WHERE id = $1", [uid]);
    }
    console.log("   ✅ Cleanup complete.");
    await db.end();
  }
}

runSimilarityTest();

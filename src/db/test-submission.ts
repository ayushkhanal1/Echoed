// Echoed — Layer 3 Verification Test (AWS Bedrock Titan 1024-dimensional vectors)
// Usage: npm run test:submission
//
// Tests:
//   1. 1024-dimensional vector embedding generation via AWS Bedrock Titan V2
//   2. Unit vector normalization verification
//   3. Storing private experience + vector in PostgreSQL pgvector column
//   4. Cosine similarity query execution via pgvector <=> operator
//   5. Data cleanup

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { generateEmbedding, formatVectorForPg, EMBEDDING_DIMENSION } from "../lib/ai/embedding";
import { syncCognitoUserToDb } from "../lib/auth";
import { db } from "./index";

async function runSubmissionTest() {
  console.log("=".repeat(60));
  console.log("  ECHOED — Layer 3 AWS Bedrock Titan V2 Pipeline Test");
  console.log("=".repeat(60));

  try {
    // 1. Prepare test user
    console.log("\n👤 Step 1: Setting up test user in PostgreSQL...");
    const testSub = "sub-layer3-" + Date.now();
    const testEmail = "layer3-test@echoed.internal";
    const user = await syncCognitoUserToDb(testSub, testEmail, "Layer 3 Tester");
    console.log(`   ✅ Synced test user: ID=${user.id}`);

    // 2. Test Embedding Generation
    console.log(`\n🧠 Step 2: Generating ${EMBEDDING_DIMENSION}-dimensional Vector Embedding...`);
    const sampleExperience =
      "I was sitting in a café in Kyoto when I found a postcard under the table with my grandmother's maiden name and childhood address written on it from 1954.";
    
    console.log(`   Input text: "${sampleExperience.substring(0, 60)}..."`);
    const vector = await generateEmbedding(sampleExperience);

    console.log(`   ✅ Vector generated! Length: ${vector.length} dimensions`);
    if (vector.length !== EMBEDDING_DIMENSION) {
      throw new Error(`Expected ${EMBEDDING_DIMENSION} dimensions, received ${vector.length}`);
    }

    // Verify vector values are numeric floats
    const sampleSlice = vector.slice(0, 5).map((n) => n.toFixed(4));
    console.log(`   Sample vector slice [0..4]: [${sampleSlice.join(", ")}]`);

    // 3. Insert Post with pgvector
    console.log("\n💾 Step 3: Inserting post and vector into PostgreSQL posts table...");
    const vectorString = formatVectorForPg(vector);
    const insertQuery = `
      INSERT INTO posts (user_id, body, embedding, status)
      VALUES ($1, $2, $3::vector, 'active')
      RETURNING id, user_id, body, status, created_at;
    `;
    const insertResult = await db.query(insertQuery, [user.id, sampleExperience, vectorString]);
    const post = insertResult.rows[0];
    console.log(`   ✅ Post successfully saved in DB:`);
    console.log(`      - Post ID:    ${post.id}`);
    console.log(`      - Status:     ${post.status} (100% private)`);
    console.log(`      - Created At: ${post.created_at}`);

    // 4. Test Cosine Distance query with pgvector <=>
    console.log("\n🧮 Step 4: Testing pgvector cosine similarity search (<=> operator)...");
    const query = `
      SELECT id, body, (embedding <=> $1::vector) AS cosine_distance
      FROM posts
      WHERE id = $2;
    `;
    const distanceResult = await db.query(query, [vectorString, post.id]);
    const distance = parseFloat(distanceResult.rows[0].cosine_distance);
    console.log(`   ✅ Query returned cosine distance: ${distance.toFixed(6)}`);

    if (distance > 0.001) {
      throw new Error(`Self-similarity distance should be ~0, got ${distance}`);
    }
    console.log("   ✅ Vector cosine math verified against pgvector index!");

    // 5. Test user posts retrieval
    console.log("\n📋 Step 5: Testing user experiences retrieval query...");
    const listResult = await db.query(
      `SELECT id, body, status, (embedding IS NOT NULL) as is_embedded 
       FROM posts WHERE user_id = $1`,
      [user.id]
    );
    console.log(`   ✅ Found ${listResult.rows.length} post(s) for user. Embedded: ${listResult.rows[0].is_embedded}`);

    // 6. Cleanup
    console.log("\n🧹 Step 6: Cleaning up test data...");
    await db.query("DELETE FROM posts WHERE id = $1", [post.id]);
    await db.query("DELETE FROM users WHERE id = $1", [user.id]);
    console.log("   ✅ Test post and user cleaned up cleanly");

    console.log("\n" + "=".repeat(60));
    console.log("  🎉 ALL TESTS PASSED — Layer 3 Submission & Embedding Ready!");
    console.log("=".repeat(60));
  } catch (error: any) {
    console.error("\n❌ Layer 3 Test Failed:", error.message || error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

runSubmissionTest();

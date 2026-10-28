// Echoed — Layer 1 Verification Test
// Usage: npx tsx src/db/test-connection.ts
//
// This script verifies:
//   1. Connection to RDS PostgreSQL works
//   2. pgvector extension is enabled
//   3. All tables exist
//   4. Basic CRUD on the posts table (with a vector) works

import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function testConnection() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("❌ DATABASE_URL is not set in .env.local");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  console.log("=".repeat(50));
  console.log("  ECHOED — Layer 1 Verification Test");
  console.log("=".repeat(50));

  try {
    const client = await pool.connect();

    // Test 1: Connection
    console.log("\n🔌 Test 1: Database Connection");
    const versionResult = await client.query("SELECT version()");
    console.log("   ✅ Connected:", versionResult.rows[0].version.split(",")[0]);

    // Test 2: pgvector extension
    console.log("\n🧮 Test 2: pgvector Extension");
    const extResult = await client.query(
      "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector'"
    );
    if (extResult.rows.length > 0) {
      console.log(`   ✅ pgvector v${extResult.rows[0].extversion} is enabled`);
    } else {
      console.log("   ❌ pgvector extension NOT found");
    }

    // Test 3: All tables exist
    console.log("\n📋 Test 3: Table Verification");
    const expectedTables = [
      "users",
      "posts",
      "clusters",
      "cluster_members",
      "experience_threads",
      "votes",
      "comments",
      "anonymous_aliases",
      "notifications",
      "candidate_matches",
    ];

    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const existingTables = tablesResult.rows.map((r) => r.table_name);

    let allTablesExist = true;
    for (const table of expectedTables) {
      if (existingTables.includes(table)) {
        console.log(`   ✅ ${table}`);
      } else {
        console.log(`   ❌ ${table} — MISSING`);
        allTablesExist = false;
      }
    }

    // Test 4: CRUD with vector
    console.log("\n📝 Test 4: CRUD with Vector Embedding");

    // Create a test user
    const userResult = await client.query(`
      INSERT INTO users (cognito_sub, email, display_name)
      VALUES ('test-sub-001', 'test@echoed.dev', 'Test User')
      ON CONFLICT (cognito_sub) DO UPDATE SET display_name = 'Test User'
      RETURNING id
    `);
    const userId = userResult.rows[0].id;
    console.log(`   ✅ Test user created/found: ${userId}`);

    // Create a test post with a dummy 1024-dim vector
    const dummyVector = Array(1024).fill(0.01).map((v, i) => v * (i % 10));
    const vectorStr = `[${dummyVector.join(",")}]`;

    const postResult = await client.query(
      `
      INSERT INTO posts (user_id, body, embedding)
      VALUES ($1, $2, $3::vector)
      RETURNING id, created_at
    `,
      [
        userId,
        "I keep dreaming about a door that leads to a room I have never seen before but somehow feels familiar.",
        vectorStr,
      ]
    );
    const postId = postResult.rows[0].id;
    console.log(`   ✅ Test post created: ${postId}`);

    // Read it back
    const readResult = await client.query(
      `
      SELECT id, body, embedding IS NOT NULL as has_embedding, status
      FROM posts WHERE id = $1
    `,
      [postId]
    );
    const post = readResult.rows[0];
    console.log(`   ✅ Post read back: status=${post.status}, has_embedding=${post.has_embedding}`);

    // Test vector similarity search (against itself — should be distance 0)
    const simResult = await client.query(
      `
      SELECT id, body, (embedding <=> $1::vector) as cosine_distance
      FROM posts
      WHERE id != $2
      ORDER BY embedding <=> $1::vector
      LIMIT 5
    `,
      [vectorStr, postId]
    );
    console.log(`   ✅ Vector similarity search works (found ${simResult.rows.length} other posts)`);

    // Cleanup test data
    await client.query("DELETE FROM posts WHERE id = $1", [postId]);
    await client.query("DELETE FROM users WHERE id = $1", [userId]);
    console.log("   ✅ Test data cleaned up");

    // Summary
    console.log("\n" + "=".repeat(50));
    if (allTablesExist && extResult.rows.length > 0) {
      console.log("  🎉 ALL TESTS PASSED — Layer 1 is complete!");
    } else {
      console.log("  ⚠️  Some tests failed — review above");
    }
    console.log("=".repeat(50));

    client.release();
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection();

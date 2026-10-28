// Echoed — Clean up all mock data
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function clean() {
  console.log("🧹 Cleaning up mock seed data from database...\n");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Delete mock clusters (cascades to experience_threads, comments, cluster_members)
    const clusterRes = await client.query(`
      DELETE FROM clusters 
      WHERE thread_title IN (
        'The Strangers with Identical 1912 Pocket Watches Stopped at 4:18',
        'The Recurring Dream of the Hidden Oval Library',
        'The Phantom 1940s Jazz Broadcast on Nevada Highway 50'
      )
      RETURNING id;
    `);
    console.log(`✓ Deleted ${clusterRes.rowCount} mock clusters & linked threads/comments`);

    // 2. Delete mock users (cascades to posts, votes, aliases)
    const userRes = await client.query(`
      DELETE FROM users 
      WHERE email LIKE 'mock_%@echoed.internal'
      RETURNING id;
    `);
    console.log(`✓ Deleted ${userRes.rowCount} mock user accounts & posts`);

    await client.query("COMMIT");
    console.log("\n✨ Database is completely clean! Zero mock leftovers.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Cleanup failed, rolled back:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

clean().catch(() => process.exit(1));

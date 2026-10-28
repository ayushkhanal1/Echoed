// Echoed — Database migration runner
// Usage: npx tsx src/db/migrate.ts

import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function migrate() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("❌ DATABASE_URL is not set in .env.local");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false, // Required for RDS connections
    },
  });

  console.log("🔌 Connecting to database...");

  try {
    // Test connection
    const client = await pool.connect();
    const result = await client.query("SELECT version()");
    console.log("✅ Connected to:", result.rows[0].version);

    // Read and execute schema
    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");

    console.log("📦 Running schema migration...");
    await client.query(schema);
    console.log("✅ Schema migration complete!");

    // Verify tables were created
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log("\n📋 Tables created:");
    tables.rows.forEach((row) => {
      console.log(`   ✅ ${row.table_name}`);
    });

    // Verify pgvector extension
    const extensions = await client.query(`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname = 'vector';
    `);

    if (extensions.rows.length > 0) {
      console.log(
        `\n🧮 pgvector extension: v${extensions.rows[0].extversion} ✅`
      );
    } else {
      console.error("\n❌ pgvector extension not found!");
    }

    client.release();
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();

// Migration: Update embedding column from vector(768) to vector(1024) for AWS Bedrock Titan v2
import { db } from "./index";

async function migrateTo1024() {
  console.log("📦 Starting migration: Upgrading pgvector to 1024 dimensions for AWS Bedrock Titan v2...");

  try {
    // 1. Drop existing index on embedding column
    console.log("   1. Dropping existing vector index...");
    await db.query("DROP INDEX IF EXISTS idx_posts_embedding;");

    // 2. Alter column type to vector(1024)
    console.log("   2. Altering posts.embedding to vector(1024)...");
    await db.query(`
      ALTER TABLE posts 
      ALTER COLUMN embedding TYPE vector(1024);
    `);

    // 3. Recreate IVFFlat index for 1024 dimensions
    console.log("   3. Re-creating IVFFlat vector index with vector_cosine_ops...");
    await db.query(`
      CREATE INDEX idx_posts_embedding ON posts
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
    `);

    console.log("✅ Successfully migrated posts.embedding to vector(1024) for AWS Bedrock Titan V2!");
  } catch (error: any) {
    console.error("❌ Migration to 1024 dimensions failed:", error.message || error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

migrateTo1024();

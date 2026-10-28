// Echoed — Database connection pool (singleton)
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const globalForDb = globalThis as unknown as {
  pgPool: Pool | undefined;
};

export function getDbPool(): Pool {
  if (!globalForDb.pgPool) {
    globalForDb.pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 30000,
      keepAlive: true,
    });
  }
  return globalForDb.pgPool;
}

// Proxy exported as `db` so db.query(...) works transparently everywhere
export const db = new Proxy({} as Pool, {
  get(_target, prop) {
    const pool = getDbPool();
    const value = (pool as any)[prop];
    if (typeof value === "function") {
      return value.bind(pool);
    }
    return value;
  },
});

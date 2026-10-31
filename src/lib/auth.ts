// Echoed — User Session Management & PostgreSQL Synchronization
import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/db";
import { verifyIdToken } from "./jwt";
import { User } from "@/types";

export const SESSION_COOKIE_NAME = "echoed_id_token";
export const ACCESS_COOKIE_NAME = "echoed_access_token";

/**
 * Upserts a Cognito user into our PostgreSQL `users` table.
 * If the user already exists by cognito_sub, updates email and updated_at.
 */
export async function syncCognitoUserToDb(
  cognitoSub: string,
  email: string,
  displayName?: string | null
): Promise<User> {
  const defaultAlias = "Echoer_" + Math.floor(100 + Math.random() * 900);
  const initialName = displayName || defaultAlias;

  const query = `
    INSERT INTO users (cognito_sub, email, display_name)
    VALUES ($1, $2, $3)
    ON CONFLICT (cognito_sub) DO UPDATE
      SET email = EXCLUDED.email,
          display_name = COALESCE(users.display_name, EXCLUDED.display_name),
          updated_at = NOW()
    RETURNING id, cognito_sub, email, display_name, created_at, updated_at;
  `;

  const values = [cognitoSub, email, initialName];
  const result = await db.query(query, values);
  return result.rows[0];
}

// React.cache is available in RSC; in standalone Node CLI scripts it falls back to a passthrough
const safeCache =
  typeof cache === "function"
    ? cache
    : <T extends (...args: any[]) => any>(fn: T): T => fn;

/**
 * Reads the session cookie and verifies the user.
 * Returns the PostgreSQL user record if authenticated, or null if unauthenticated.
 */
export const getSessionUser = safeCache(async (): Promise<User | null> => {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const payload = await verifyIdToken(token);
    if (!payload.sub || !payload.email) {
      return null;
    }

    // Query user from database
    const userResult = await db.query(
      `SELECT id, cognito_sub, email, display_name, created_at, updated_at
       FROM users
       WHERE cognito_sub = $1`,
      [payload.sub]
    );

    if (userResult.rows.length === 0) {
      // Sync on the fly if not yet recorded
      return await syncCognitoUserToDb(payload.sub, payload.email);
    }

    return userResult.rows[0];
  } catch (error) {
    // Expired or invalid token
    return null;
  }
});

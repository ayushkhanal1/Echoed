// Echoed — Layer 2 Verification Test
// Usage: npm run test:auth
//
// Tests:
//   1. Environment variable completeness
//   2. Cognito Secret Hash generation
//   3. Direct connection to Cognito JWKS endpoint
//   4. Syncing a Cognito user profile to PostgreSQL users table
//   5. Database user retrieval and cleanup

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { calculateSecretHash } from "../lib/cognito";
import { syncCognitoUserToDb } from "../lib/auth";
import { db } from "./index";

async function runAuthTest() {
  console.log("=".repeat(55));
  console.log("  ECHOED — Layer 2 Authentication & User Sync Test");
  console.log("=".repeat(55));

  try {
    // Test 1: Config
    console.log("\n🔑 Test 1: Configuration Verification");
    const requiredEnv = [
      "COGNITO_REGION",
      "COGNITO_USER_POOL_ID",
      "COGNITO_CLIENT_ID",
      "COGNITO_CLIENT_SECRET",
      "DATABASE_URL",
    ];

    for (const envName of requiredEnv) {
      if (!process.env[envName]) {
        throw new Error(`Missing environment variable: ${envName}`);
      }
      console.log(`   ✅ ${envName} is configured`);
    }

    // Test 2: Secret Hash Calculation
    console.log("\n🔐 Test 2: Cognito HMAC-SHA256 Secret Hash Calculation");
    const testEmail = "architect-test@echoed.internal";
    const secretHash = calculateSecretHash(testEmail);
    if (!secretHash || secretHash.length < 20) {
      throw new Error("Generated secret hash appears invalid");
    }
    console.log("   ✅ Secret Hash computed successfully:", secretHash.substring(0, 12) + "...");

    // Test 3: Live Cognito JWKS connectivity
    console.log("\n🌐 Test 3: AWS Cognito Public JWKS Endpoint Connectivity");
    const region = process.env.COGNITO_REGION;
    const poolId = process.env.COGNITO_USER_POOL_ID;
    const jwksUrl = `https://cognito-idp.${region}.amazonaws.com/${poolId}/.well-known/jwks.json`;

    const jwksResponse = await fetch(jwksUrl);
    if (!jwksResponse.ok) {
      throw new Error(`Failed to fetch JWKS from ${jwksUrl}: ${jwksResponse.statusText}`);
    }
    const jwksData = await jwksResponse.json();
    if (!Array.isArray(jwksData.keys) || jwksData.keys.length === 0) {
      throw new Error("JWKS endpoint returned no public keys");
    }
    console.log(`   ✅ Successfully retrieved ${jwksData.keys.length} public key(s) from Cognito User Pool`);

    // Test 4: PostgreSQL User Synchronization
    console.log("\n🗄️ Test 4: PostgreSQL User Profile Synchronization");
    const mockCognitoSub = "sub-" + Date.now();
    const syncedUser = await syncCognitoUserToDb(
      mockCognitoSub,
      testEmail,
      "Echoed Architect"
    );

    console.log(`   ✅ User row synced into PostgreSQL!`);
    console.log(`      - DB User ID:    ${syncedUser.id}`);
    console.log(`      - Cognito Sub:   ${syncedUser.cognito_sub}`);
    console.log(`      - Email:         ${syncedUser.email}`);
    console.log(`      - Display Name:  ${syncedUser.display_name}`);

    // Test 5: Verify Query from Database
    console.log("\n🔍 Test 5: Querying Synced User by cognito_sub");
    const queryResult = await db.query(
      "SELECT id, cognito_sub, email FROM users WHERE cognito_sub = $1",
      [mockCognitoSub]
    );

    if (queryResult.rows.length === 0) {
      throw new Error("Could not find synced user in database query");
    }
    console.log(`   ✅ Verified user exists in PostgreSQL: ${queryResult.rows[0].email}`);

    // Test 6: Clean Up
    console.log("\n🧹 Test 6: Cleaning up test user record");
    await db.query("DELETE FROM users WHERE cognito_sub = $1", [mockCognitoSub]);
    console.log("   ✅ Test user successfully removed");

    console.log("\n" + "=".repeat(55));
    console.log("  🎉 ALL TESTS PASSED — Layer 2 Auth Foundation Ready!");
    console.log("=".repeat(55));
  } catch (err: any) {
    console.error("\n❌ Layer 2 Test Failed:", err.message || err);
    process.exit(1);
  } finally {
    await db.end();
  }
}

runAuthTest();

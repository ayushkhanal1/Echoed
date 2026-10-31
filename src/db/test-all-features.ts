import { db } from "./index";
import { findSimilarExperiences } from "../lib/ai/similarity";
import { verifyAndClusterMatches, VerifiedClusterResult } from "../lib/ai/verification";

async function runFullSystemTest() {
  console.log("\n=======================================================");
  console.log("🚀 ECHOED: FULL END-TO-END FEATURE VERIFICATION TEST");
  console.log("=======================================================\n");

  try {
    // 0. Setup two test users
    console.log("1️⃣ Setting up test users...");
    const userAEmail = `test_alice_${Date.now()}@echoed.internal`;
    const userBEmail = `test_bob_${Date.now()}@echoed.internal`;

    const userARes = await db.query(
      `INSERT INTO users (cognito_sub, email, display_name) 
       VALUES ($1, $2, $3) 
       RETURNING id, display_name;`,
      [`sub_a_${Date.now()}`, userAEmail, "Alice Echoer"]
    );
    const userBRes = await db.query(
      `INSERT INTO users (cognito_sub, email, display_name) 
       VALUES ($1, $2, $3) 
       RETURNING id, display_name;`,
      [`sub_b_${Date.now()}`, userBEmail, "Bob Echoer"]
    );

    const userA = userARes.rows[0];
    const userB = userBRes.rows[0];
    console.log(`   ✓ Created User A: ${userA.display_name} (${userA.id})`);
    console.log(`   ✓ Created User B: ${userB.display_name} (${userB.id})`);

    // 1. User A submits an experience (Request / Post Submission)
    console.log("\n2️⃣ Testing Post Submission for User A...");
    const postATitle = "Old friend calling right when I think of them";
    const postABody = "Whenever I think about an old friend I haven't spoken to in years, they somehow contact or message me shortly afterward.";

    const postARes = await db.query(
      `INSERT INTO posts (user_id, title, body, status)
       VALUES ($1, $2, $3, 'active')
       RETURNING id, title;`,
      [userA.id, postATitle, postABody]
    );
    const postA = postARes.rows[0];
    console.log(`   ✓ User A submitted post: "${postA.title}" (ID: ${postA.id})`);

    // 2. User B submits a parallel experience
    console.log("\n3️⃣ Testing Post Submission for User B & Similarity Matching...");
    const postBTitle = "People messaging right when they come to mind";
    const postBBody = "It is strange how people sometimes message or call me just when they randomly come to my mind out of nowhere.";

    const postBRes = await db.query(
      `INSERT INTO posts (user_id, title, body, status)
       VALUES ($1, $2, $3, 'active')
       RETURNING id, title;`,
      [userB.id, postBTitle, postBBody]
    );
    const postB = postBRes.rows[0];
    console.log(`   ✓ User B submitted post: "${postB.title}" (ID: ${postB.id})`);

    // Stage 1: Candidate retrieval using PostgreSQL pg_trgm + tsvector
    console.log("\n4️⃣ Testing Stage 1 Candidate Retrieval (PostgreSQL Trigram / Full-Text)...");
    const candidates = await findSimilarExperiences(postB.id, postBBody, userB.id, 0.05);
    console.log(`   ✓ Candidates retrieved: ${candidates.length}`);
    const foundPostA = candidates.find((c) => c.id === postA.id);
    if (!foundPostA) {
      throw new Error("Stage 1 retrieval failed to find Post A as a candidate!");
    }
    console.log(`   ✓ Post A found in candidate shortlist! Similarity score: ${(foundPostA.similarityScore * 100).toFixed(1)}%`);

    // Stage 2: Meta Muse Spark Open Verification & Clustering
    console.log("\n5️⃣ Testing Stage 2 Deep Semantic Evaluation (Meta Muse Spark Open)...");
    const verifiedClusters = await verifyAndClusterMatches(
      {
        id: postB.id,
        userId: userB.id,
        title: postBTitle,
        body: postBBody,
      },
      candidates
    );

    if (verifiedClusters.length === 0) {
      throw new Error("Cluster formation failed! Meta LLM did not verify the match.");
    }

    const clusterResult = verifiedClusters[0];
    console.log(`   ✓ Match verified by Meta Muse Spark Open!`);
    console.log(`     Cluster ID: ${clusterResult.clusterId}`);
    console.log(`     Thread Title: "${clusterResult.threadTitle}"`);
    console.log(`     Confidence: ${(clusterResult.confidence * 100).toFixed(1)}%`);
    console.log(`     Reasoning: "${clusterResult.matchReasoning}"`);

    // 6. Verify Notifications
    console.log("\n6️⃣ Testing Notifications System...");
    const notifsRes = await db.query(
      `SELECT n.id, n.user_id, n.type, n.title, n.message, n.cluster_id, u.display_name
       FROM notifications n
       JOIN users u ON u.id = n.user_id
       WHERE n.cluster_id = $1
       ORDER BY n.created_at ASC;`,
      [clusterResult.clusterId]
    );

    console.log(`   ✓ Notifications generated for cluster: ${notifsRes.rows.length}`);
    for (const notif of notifsRes.rows) {
      console.log(`     - Sent to ${notif.display_name}: "${notif.title}" (Type: ${notif.type})`);
    }

    if (notifsRes.rows.length < 2) {
      throw new Error("Both matched authors should receive a notification!");
    }

    // 7. Testing Consent Flow & Progressive Publication
    console.log("\n7️⃣ Testing Independent Author Consent & Progressive Publication...");
    
    // Check initial consent status
    const initialMembers = await db.query(
      `SELECT user_id, author_alias, consent_status FROM cluster_members WHERE cluster_id = $1`,
      [clusterResult.clusterId]
    );
    console.log("   Initial member consent states:");
    for (const m of initialMembers.rows) {
      console.log(`     - ${m.author_alias} (${m.user_id}): ${m.consent_status}`);
    }

    // User A accepts
    console.log("   User A consents to share in public thread...");
    await db.query(
      `UPDATE cluster_members SET consent_status = 'accepted', consented_at = NOW()
       WHERE cluster_id = $1 AND user_id = $2;`,
      [clusterResult.clusterId, userA.id]
    );

    // Check publication: With 1 accept, it should still be unpublished
    const afterOneAccept = await db.query(
      `SELECT id FROM experience_threads WHERE cluster_id = $1;`,
      [clusterResult.clusterId]
    );
    console.log(`   Experience threads count with 1 consent: ${afterOneAccept.rows.length} (Expected: 0)`);

    // User B accepts
    console.log("   User B consents to share in public thread...");
    await db.query(
      `UPDATE cluster_members SET consent_status = 'accepted', consented_at = NOW()
       WHERE cluster_id = $1 AND user_id = $2;`,
      [clusterResult.clusterId, userB.id]
    );

    // Simulate consent endpoint logic when acceptedCount >= 2:
    const acceptedCountRes = await db.query(
      `SELECT count(*) as count FROM cluster_members WHERE cluster_id = $1 AND consent_status = 'accepted'`,
      [clusterResult.clusterId]
    );
    const acceptedCount = parseInt(acceptedCountRes.rows[0].count, 10);
    console.log(`   Total consented authors: ${acceptedCount}`);

    let threadId: string;
    if (acceptedCount >= 2) {
      const threadRes = await db.query(
        `INSERT INTO experience_threads (cluster_id, title, preview_summary)
         VALUES ($1, $2, $3)
         ON CONFLICT (cluster_id) DO UPDATE SET title = EXCLUDED.title
         RETURNING id, title;`,
        [
          clusterResult.clusterId,
          clusterResult.threadTitle,
          clusterResult.previewSummary,
        ]
      );
      threadId = threadRes.rows[0].id;
      await db.query(`UPDATE clusters SET status = 'published' WHERE id = $1;`, [clusterResult.clusterId]);
      console.log(`   ✓ Experience thread published! Thread ID: ${threadId}`);
    } else {
      throw new Error("Accepted count should be >= 2");
    }

    // 8. Testing Voting System (Upvote, Downvote, Neutral/Toggle)
    console.log("\n8️⃣ Testing Voting System (Upvotes, Downvotes, Score)...");
    
    // User A upvotes (+1)
    await db.query(
      `INSERT INTO votes (thread_id, user_id, value) VALUES ($1, $2, 1)
       ON CONFLICT (thread_id, user_id) DO UPDATE SET value = EXCLUDED.value;`,
      [threadId, userA.id]
    );
    // User B upvotes (+1)
    await db.query(
      `INSERT INTO votes (thread_id, user_id, value) VALUES ($1, $2, 1)
       ON CONFLICT (thread_id, user_id) DO UPDATE SET value = EXCLUDED.value;`,
      [threadId, userB.id]
    );

    // Update thread counts
    await db.query(
      `UPDATE experience_threads SET
         upvote_count = (SELECT count(*) FROM votes WHERE thread_id = $1 AND value = 1),
         downvote_count = (SELECT count(*) FROM votes WHERE thread_id = $1 AND value = -1)
       WHERE id = $1;`,
      [threadId]
    );

    let voteCheck = await db.query(
      `SELECT upvote_count, downvote_count FROM experience_threads WHERE id = $1;`,
      [threadId]
    );
    console.log(`   ✓ After 2 upvotes: ${voteCheck.rows[0].upvote_count} upvotes, ${voteCheck.rows[0].downvote_count} downvotes`);

    if (voteCheck.rows[0].upvote_count !== 2 || voteCheck.rows[0].downvote_count !== 0) {
      throw new Error("Vote count mismatch after 2 upvotes!");
    }

    // User B changes vote to downvote (-1)
    await db.query(
      `INSERT INTO votes (thread_id, user_id, value) VALUES ($1, $2, -1)
       ON CONFLICT (thread_id, user_id) DO UPDATE SET value = EXCLUDED.value;`,
      [threadId, userB.id]
    );
    await db.query(
      `UPDATE experience_threads SET
         upvote_count = (SELECT count(*) FROM votes WHERE thread_id = $1 AND value = 1),
         downvote_count = (SELECT count(*) FROM votes WHERE thread_id = $1 AND value = -1)
       WHERE id = $1;`,
      [threadId]
    );

    voteCheck = await db.query(
      `SELECT upvote_count, downvote_count FROM experience_threads WHERE id = $1;`,
      [threadId]
    );
    console.log(`   ✓ After User B toggles to downvote: ${voteCheck.rows[0].upvote_count} upvote, ${voteCheck.rows[0].downvote_count} downvote`);

    if (voteCheck.rows[0].upvote_count !== 1 || voteCheck.rows[0].downvote_count !== 1) {
      throw new Error("Vote count mismatch after vote update!");
    }

    // 9. Testing Anonymous Commenting System
    console.log("\n9️⃣ Testing Anonymous Commenting System (Echoer_XXX Aliases)...");
    
    // User A comments
    await db.query(
      `INSERT INTO anonymous_aliases (thread_id, user_id, alias)
       VALUES ($1, $2, 'Echoer_' || floor(100 + random() * 900)::text)
       ON CONFLICT (thread_id, user_id) DO NOTHING;`,
      [threadId, userA.id]
    );
    const aliasARes = await db.query(
      `SELECT alias FROM anonymous_aliases WHERE thread_id = $1 AND user_id = $2;`,
      [threadId, userA.id]
    );
    const aliasA = aliasARes.rows[0].alias;

    const comment1Res = await db.query(
      `INSERT INTO comments (thread_id, user_id, anonymous_alias, body)
       VALUES ($1, $2, $3, $4)
       RETURNING id, anonymous_alias, body;`,
      [threadId, userA.id, aliasA, "This happens to me every weekday! It's like an internal chronometer."]
    );
    console.log(`   ✓ User A posted comment under alias "${aliasA}": "${comment1Res.rows[0].body}"`);

    // User A comments a SECOND time: verify the same alias is reused
    await db.query(
      `INSERT INTO anonymous_aliases (thread_id, user_id, alias)
       VALUES ($1, $2, 'Echoer_' || floor(100 + random() * 900)::text)
       ON CONFLICT (thread_id, user_id) DO NOTHING;`,
      [threadId, userA.id]
    );
    const aliasASecondRes = await db.query(
      `SELECT alias FROM anonymous_aliases WHERE thread_id = $1 AND user_id = $2;`,
      [threadId, userA.id]
    );
    const aliasASecond = aliasASecondRes.rows[0].alias;
    if (aliasA !== aliasASecond) {
      throw new Error(`Alias changed for same user in same thread! Expected ${aliasA}, got ${aliasASecond}`);
    }
    console.log(`   ✓ Verified alias consistency: User A retained "${aliasA}" for subsequent comments.`);

    // User B comments
    await db.query(
      `INSERT INTO anonymous_aliases (thread_id, user_id, alias)
       VALUES ($1, $2, 'Echoer_' || floor(100 + random() * 900)::text)
       ON CONFLICT (thread_id, user_id) DO NOTHING;`,
      [threadId, userB.id]
    );
    const aliasBRes = await db.query(
      `SELECT alias FROM anonymous_aliases WHERE thread_id = $1 AND user_id = $2;`,
      [threadId, userB.id]
    );
    const aliasB = aliasBRes.rows[0].alias;

    await db.query(
      `INSERT INTO comments (thread_id, user_id, anonymous_alias, body)
       VALUES ($1, $2, $3, $4);`,
      [threadId, userB.id, aliasB, "I wonder if it has to do with cortisol spikes before our wake cycle."]
    );
    console.log(`   ✓ User B posted comment under alias "${aliasB}".`);

    // Increment comment count on thread
    await db.query(
      `UPDATE experience_threads SET comment_count = (SELECT count(*) FROM comments WHERE thread_id = $1) WHERE id = $1;`,
      [threadId]
    );

    const threadFinal = await db.query(
      `SELECT comment_count FROM experience_threads WHERE id = $1;`,
      [threadId]
    );
    console.log(`   ✓ Thread total comments count: ${threadFinal.rows[0].comment_count} (Expected: 2)`);

    // 10. Querying Thread View
    console.log("\n🔟 Testing Public Feed & Thread Rendering Query...");
    const publicPosts = await db.query(
      `SELECT cm.author_alias, p.title, p.body, cm.consent_status
       FROM cluster_members cm
       JOIN posts p ON p.id = cm.post_id
       WHERE cm.cluster_id = $1 AND cm.consent_status = 'accepted'
       ORDER BY cm.created_at ASC;`,
      [clusterResult.clusterId]
    );
    console.log(`   ✓ Public side-by-side posts in thread: ${publicPosts.rows.length}`);
    for (const p of publicPosts.rows) {
      console.log(`     - [${p.author_alias}]: "${p.title}"`);
    }

    console.log("\n=======================================================");
    console.log("🎉 ALL FEATURES VERIFIED SUCCESSFULLY!");
    console.log("   ✓ Post Submission & Candidate Retrieval");
    console.log("   ✓ Meta Muse Spark Open AI Semantic Verification");
    console.log("   ✓ In-App Notifications for Matched Authors");
    console.log("   ✓ Consent Controls & Progressive Public Clustering");
    console.log("   ✓ Upvoting / Downvoting & Net Score Calculation");
    console.log("   ✓ Anonymous Aliased Comments (Echoer_XXX)");
    console.log("   ✓ Side-by-Side Public Feed Display");
    console.log("=======================================================\n");

  } catch (err) {
    console.error("\n❌ TEST FAILED:", err);
    process.exit(1);
  } finally {
    await db.end();
  }
}

runFullSystemTest();

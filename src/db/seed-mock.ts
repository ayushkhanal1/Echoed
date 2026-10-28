// Echoed — Seed Realistic Mock Feed Data for Testing
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { Pool } from "pg";
import { generateEmbedding } from "../lib/ai/embedding";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  console.log("🌱 Starting Mock Data Seeding for Echoed Feed...\n");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Create Mock Authors
    const mockUsers = [
      { email: "mock_author_1@echoed.internal", sub: "mock_sub_1", alias: "Echoer_Pacific" },
      { email: "mock_author_2@echoed.internal", sub: "mock_sub_2", alias: "Echoer_Melbourne" },
      { email: "mock_author_3@echoed.internal", sub: "mock_sub_3", alias: "Echoer_Kyoto" },
      { email: "mock_author_4@echoed.internal", sub: "mock_sub_4", alias: "Echoer_Nevada" },
      { email: "mock_author_5@echoed.internal", sub: "mock_sub_5", alias: "Echoer_Austin" },
    ];

    const userMap: Record<string, string> = {};

    for (const u of mockUsers) {
      const res = await client.query(
        `INSERT INTO users (cognito_sub, email, display_name)
         VALUES ($1, $2, $3)
         ON CONFLICT (cognito_sub) DO UPDATE
           SET email = EXCLUDED.email, display_name = EXCLUDED.display_name
         RETURNING id;`,
        [u.sub, u.email, u.alias]
      );
      userMap[u.alias] = res.rows[0].id;
    }

    console.log("✓ Created / verified 5 mock author accounts");

    // Helper to format pgvector string
    const formatVector = (arr: number[]) => `[${arr.join(",")}]`;

    // 2. Define the 3 Shared Coincidence Clusters
    const clustersData = [
      {
        title: "The Strangers with Identical 1912 Pocket Watches Stopped at 4:18",
        summary:
          "Two strangers living on opposite sides of the Pacific discovered the exact same silver pocket watch in estate sales, both permanently rusted shut at 4:18 PM with identical engraving: 'For Eleanor, across time'.",
        reasoning:
          "Meta AI identified semantic convergence across distinct geographic locations. Both experiences describe finding an identical rare horological artifact (1912 silver pocket watch) with identical failure state (frozen at 4:18) and matching custom rear engraving.",
        upvotes: 142,
        downvotes: 6,
        authors: [
          {
            userAlias: "Echoer_Pacific",
            title: "The Eleanor Pocket Watch from an Oregon Barn Sale",
            body: "Last summer while driving through rural Oregon, I stopped at an old barn sale and found a tarnished silver pocket watch dated 1912. The hands were rusted solid at exactly 4:18 PM. When I rubbed off the grime on the inside casing, it was hand-inscribed: 'For Eleanor, across time'. It gave me chills, and I've kept it on my desk ever since wondering who Eleanor was.",
          },
          {
            userAlias: "Echoer_Melbourne",
            title: "Found the Sister Watch in a Melbourne Antique Market",
            body: "I collect antique timepieces in Victoria, Australia. In November 2023, I purchased an unbranded 1912 silver pocket watch from an estate box. Amazingly, the mechanism was jammed right at 4:18. Upon removing the dust cover, the exact words were etched: 'For Eleanor, across time'. I've searched watchmaker registries worldwide with zero record of this watchmaker.",
          },
        ],
        comments: [
          {
            userAlias: "Echoer_Austin",
            anonAlias: "Echoer_782",
            body: "This gave me absolute goosebumps. Could it have been twin watches made for lovers separated by the First World War?",
          },
          {
            userAlias: "Echoer_Nevada",
            anonAlias: "Echoer_119",
            body: "4:18 PM... I wonder if that was the exact moment of a train departure or ship sailing in 1912.",
          },
          {
            userAlias: "Echoer_Kyoto",
            anonAlias: "Echoer_405",
            body: "Finding both watches a century later on opposite continents is the definition of a true glitch in the matrix.",
          },
        ],
      },
      {
        title: "The Recurring Dream of the Hidden Oval Library",
        summary:
          "Two people who have never met both described an identical recurring childhood dream: discovering an oval room hidden behind a grandfather clock, filled with leather books and amber hexagonal skylights.",
        reasoning:
          "High-dimensional vector clustering isolated an uncanny architectural match: identical room geometry (oval), unique secret access mechanism (behind pendulum clock), and identical lighting condition (amber hexagonal skylights).",
        upvotes: 89,
        downvotes: 2,
        authors: [
          {
            userAlias: "Echoer_Kyoto",
            title: "The Oval Library Dream Since Age 7",
            body: "Since I was seven years old, whenever I have a fever, I dream of walking through a wood-paneled hallway, pushing aside an antique pendulum clock, and entering an oval library with golden amber hexagonal glass skylights. The smell of cedar and old paper is so vivid I can almost touch it.",
          },
          {
            userAlias: "Echoer_Austin",
            title: "The Hexagonal Skylights Dream",
            body: "I thought I was the only person who had this dream. It's always an oval-shaped private library hidden behind an old mahogany clock. The most specific part is the ceiling: six-sided amber stained glass panels casting honey-colored light over rows of unread books.",
          },
        ],
        comments: [
          {
            userAlias: "Echoer_Melbourne",
            anonAlias: "Echoer_911",
            body: "Carl Jung's collective unconscious in action right here. That is terrifyingly specific.",
          },
          {
            userAlias: "Echoer_Pacific",
            anonAlias: "Echoer_342",
            body: "Could this be an actual historical manor that was photographed in an old encyclopedia we all saw as children?",
          },
        ],
      },
      {
        title: "The Phantom 1940s Jazz Broadcast on Nevada Highway 50",
        summary:
          "Two solo road-trippers experienced the exact same anomaly at Mile Marker 182: modern FM digital radios spontaneously switching to an eerie 1940s big-band swing broadcast accompanied by rhythmic Morse code clicks.",
        reasoning:
          "Meta AI correlated precise geolocation (Nevada US-50 MM182), frequency band distortion, and acoustic description of anomalous wartime radio signals.",
        upvotes: 64,
        downvotes: 1,
        authors: [
          {
            userAlias: "Echoer_Nevada",
            title: "Mile Marker 182 Radio Anomaly",
            body: "Driving alone through central Nevada on Highway 50 around 2:00 AM, my Apple CarPlay suddenly dropped out and the radio tuned itself to an analog static band playing a scratchy 1940s trumpet solo. Every 15 seconds, a sharp mechanical Morse code burst interrupted the music. Lasted for exactly 3 miles.",
          },
          {
            userAlias: "Echoer_Pacific",
            title: "Strange Swing Music Near Loneliest Road",
            body: "I experienced this exact same event in April 2024! Right around the salt flat stretches of US-50, the stereo cut to a faint jazz broadcast from the WW2 era with rapid telegraph clicks. As soon as I passed the mountain curve, static took over and CarPlay reconnected.",
          },
        ],
        comments: [
          {
            userAlias: "Echoer_Melbourne",
            anonAlias: "Echoer_529",
            body: "Highway 50 is known for military radar testing sites near Fallon, could it be an atmospheric ducting echo?",
          },
          {
            userAlias: "Echoer_Austin",
            anonAlias: "Echoer_830",
            body: "I live in Reno and truckers talk about that stretch all the time. Glad to see it finally documented here.",
          },
        ],
      },
    ];

    for (const c of clustersData) {
      console.log(`\n📦 Processing cluster: "${c.title}"...`);

      // A. Insert Cluster
      const clusterRes = await client.query(
        `INSERT INTO clusters (thread_title, preview_summary, match_reasoning, status)
         VALUES ($1, $2, $3, 'published')
         RETURNING id;`,
        [c.title, c.summary, c.reasoning]
      );
      const clusterId = clusterRes.rows[0].id;

      // B. Insert Posts & Cluster Members
      for (let i = 0; i < c.authors.length; i++) {
        const a = c.authors[i];
        const userId = userMap[a.userAlias];
        const embedding = await generateEmbedding(`${a.title} ${a.body}`);

        const postRes = await client.query(
          `INSERT INTO posts (user_id, title, body, embedding, status)
           VALUES ($1, $2, $3, $4::vector, 'active')
           RETURNING id;`,
          [userId, a.title, a.body, formatVector(embedding)]
        );
        const postId = postRes.rows[0].id;

        await client.query(
          `INSERT INTO cluster_members (cluster_id, post_id, user_id, author_alias, consent_status)
           VALUES ($1, $2, $3, $4, 'accepted');`,
          [clusterId, postId, userId, `Author #${i + 1} (${a.userAlias})`]
        );
      }

      // C. Insert Experience Thread
      const threadRes = await client.query(
        `INSERT INTO experience_threads (
           cluster_id, title, preview_summary, upvote_count, downvote_count, comment_count
         ) VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id;`,
        [
          clusterId,
          c.title,
          c.summary,
          c.upvotes,
          c.downvotes,
          c.comments.length,
        ]
      );
      const threadId = threadRes.rows[0].id;

      // D. Insert Comments
      for (const cm of c.comments) {
        const commenterUserId = userMap[cm.userAlias];
        await client.query(
          `INSERT INTO comments (thread_id, user_id, anonymous_alias, body)
           VALUES ($1, $2, $3, $4);`,
          [threadId, commenterUserId, cm.anonAlias, cm.body]
        );
      }

      console.log(`  ✓ Published thread ID: ${threadId}`);
    }

    await client.query("COMMIT");
    console.log("\n🎉 Mock data seeding completed successfully!");
    console.log("👉 Visit http://localhost:3000/feed to see your live populated feed!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Seeding failed, rolled back:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(() => process.exit(1));

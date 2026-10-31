// Test live connection to Baseten Muse Spark Open
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { verifyWithMetaLLM } from "../lib/ai/meta-llm";

async function testBaseten() {
  console.log("=".repeat(60));
  console.log("  Testing Meta Muse Spark Open via Baseten Inference API");
  console.log("=".repeat(60));

  const apiKey = process.env.META_LLM_API_KEY || process.env.BASETEN_API_KEY;
  if (!apiKey) {
    console.error("❌ META_LLM_API_KEY is not set in .env.local!");
    console.log("Please paste your Baseten key into .env.local as:");
    console.log("META_LLM_API_KEY=your_key_here");
    process.exit(1);
  }

  console.log("Key found:", apiKey.substring(0, 8) + "...");
  console.log("Model: meta-models/muse-spark-open-1026");
  console.log("Endpoint: https://inference.baseten.co/v1/chat/completions\n");

  const story1 = {
    id: "test-1",
    title: "1912 Pocket Watch stopped at 4:18",
    body: "I found an unbranded 1912 silver pocket watch in Victoria, Australia. The hands were rusted solid at 4:18 PM. Inside, it was hand-inscribed: 'For Eleanor, across time'.",
  };

  const story2 = {
    id: "test-2",
    title: "Sister pocket watch in Oregon",
    body: "At a rural Oregon barn sale, I bought a 1912 silver pocket watch frozen at 4:18 PM. Inside was the engraving: 'For Eleanor, across time'.",
  };

  console.log("Sending pair to Muse Spark Open...");
  const result = await verifyWithMetaLLM(story1, story2);

  console.log("\n🎉 Live Response from Muse Spark Open:");
  console.log(`- Is Coincidence: ${result.isCoincidence}`);
  console.log(`- Confidence:     ${(result.confidence * 100).toFixed(0)}%`);
  console.log(`- Thread Title:   "${result.threadTitle}"`);
  console.log(`- Summary:        "${result.previewSummary}"`);
  console.log(`- Reasoning:      "${result.matchReasoning}"`);
  console.log(`- Model:          ${result.model}`);
}

testBaseten().catch(console.error);

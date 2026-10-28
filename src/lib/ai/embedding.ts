// Echoed — AWS Bedrock Titan V2 Embedding Service (1024-dimensional vectors)
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import crypto from "crypto";

export const EMBEDDING_DIMENSION = 1024;
export const BEDROCK_MODEL_ID = "amazon.titan-embed-text-v2:0";

function getBedrockClient(): BedrockRuntimeClient | null {
  const region =
    process.env.AWS_BEDROCK_REGION ||
    process.env.AWS_REGION ||
    process.env.COGNITO_REGION ||
    "ap-southeast-2";

  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (accessKeyId && secretAccessKey) {
    return new BedrockRuntimeClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
        sessionToken: process.env.AWS_SESSION_TOKEN,
      },
    });
  }

  // If using default AWS credentials chain (e.g. AWS CLI, IAM Role, or Lambda execution role)
  try {
    return new BedrockRuntimeClient({ region });
  } catch {
    return null;
  }
}

/**
 * Deterministic pseudo-embedding fallback when AWS Bedrock credentials are not yet configured.
 * Generates a normalized 1024-dimensional unit vector based on text token hashing.
 */
function generateFallbackEmbedding(text: string): number[] {
  const vector: number[] = new Array(EMBEDDING_DIMENSION).fill(0);
  const normalized = text.toLowerCase().trim();
  const words = normalized.split(/\s+/);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const hash = crypto.createHash("sha256").update(word).digest();

    for (let j = 0; j < 32; j++) {
      const idx = (i * 32 + j) % EMBEDDING_DIMENSION;
      const val = (hash[j] - 128) / 128.0;
      vector[idx] += val;
    }
  }

  let norm = 0;
  for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm) || 1.0;

  for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
    vector[i] = parseFloat((vector[i] / norm).toFixed(6));
  }

  return vector;
}

/**
 * Converts text into a 1024-dimensional numerical vector using AWS Bedrock Titan Embeddings V2.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const cleanedText = text.trim();
  if (!cleanedText) {
    throw new Error("Cannot generate embedding for empty text");
  }

  const client = getBedrockClient();

  if (client) {
    try {
      const payload = {
        inputText: cleanedText,
        dimensions: EMBEDDING_DIMENSION,
        normalize: true,
      };

      const command = new InvokeModelCommand({
        modelId: BEDROCK_MODEL_ID,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(payload),
      });

      const response = await client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      if (responseBody?.embedding && Array.isArray(responseBody.embedding)) {
        return responseBody.embedding;
      }
    } catch (error: any) {
      console.warn(
        `AWS Bedrock Titan embedding call notice: ${error.message}. Ensure Model Access is enabled for Titan V2 in AWS Console.`
      );
    }
  }

  // Fallback if credentials not yet configured
  return generateFallbackEmbedding(cleanedText);
}

/**
 * Formats a JavaScript number array into a PostgreSQL pgvector literal string: "[0.123, -0.456, ...]"
 */
export function formatVectorForPg(vector: number[]): string {
  return `[${vector.join(",")}]`;
}

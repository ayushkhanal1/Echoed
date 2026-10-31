const fs = require("fs");

const allowedPrefixes = [
  "NEXT_PUBLIC_",
  "COGNITO_",
  "DATABASE_",
  "META_LLM_",
  "AWS_",
];

const lines = Object.entries(process.env)
  .filter(([key]) => allowedPrefixes.some((prefix) => key.startsWith(prefix)))
  .map(([key, value]) => `${key}=${value}`);

if (lines.length > 0) {
  fs.writeFileSync(".env.production", lines.join("\n") + "\n");
  console.log(
    `[build-env] Injected ${lines.length} environment variables into .env.production`
  );
} else {
  console.log("[build-env] No matching environment variables found in process.env");
}

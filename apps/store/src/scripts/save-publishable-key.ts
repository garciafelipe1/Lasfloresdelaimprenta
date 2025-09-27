import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

export function savePublishableKey(token: string) {
  // ENV file path
  const envPath = path.resolve(__dirname, "../../../www/.env");

  // Read existing env
  let envContent = "";
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf-8");
  }

  // Parse existing env
  const parsedEnv = dotenv.parse(envContent);

  // Set or update the PUBLISHABLE_API_KEY
  parsedEnv["NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY"] = token;

  // Rebuild .env content
  const newEnvContent = Object.entries(parsedEnv)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  // Write back to .env
  fs.writeFileSync(envPath, newEnvContent);
}

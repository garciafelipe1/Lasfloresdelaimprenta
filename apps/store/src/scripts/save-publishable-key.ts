import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

export function savePublishableKey(token: string) {
  // Es "publishable", así que es seguro mostrarlo (se usa en frontend).
  // Esto ayuda especialmente en Railway/CI donde escribir archivos puede no persistir.
  // eslint-disable-next-line no-console
  console.log(`[seed] NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${token}`);

  // ENV file path
  const envPath = path.resolve(__dirname, "../../../www/.env");

  try {
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
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(
      `[seed] No pude escribir ${envPath}. Copiá la key desde logs y ponela en Vercel/Railway.`,
      err
    );
  }
}

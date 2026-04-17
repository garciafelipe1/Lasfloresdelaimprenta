import * as crypto from "crypto";

const PREFIX = "WF";

/**
 * Código alfanumérico largo, difícil de adivinar; una promoción Medusa por cliente.
 */
export function generateWelcomePromoCode(): string {
  const bytes = crypto.randomBytes(8);
  const suffix = bytes
    .toString("base64")
    .replace(/\+/g, "")
    .replace(/\//g, "")
    .replace(/=/g, "")
    .slice(0, 12)
    .toUpperCase();
  return `${PREFIX}-${suffix}`;
}

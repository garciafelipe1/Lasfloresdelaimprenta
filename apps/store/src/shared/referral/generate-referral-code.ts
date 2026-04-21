import * as crypto from "crypto";

const PREFIX = "RF";

export function generateReferralOwnCode(): string {
  const bytes = crypto.randomBytes(6);
  const suffix = bytes
    .toString("base64")
    .replace(/\+/g, "")
    .replace(/\//g, "")
    .replace(/=/g, "")
    .slice(0, 10)
    .toUpperCase();
  return `${PREFIX}-${suffix}`;
}

export function normalizeReferralCode(raw: string): string {
  return raw.trim().toUpperCase();
}

import Medusa from "@medusajs/js-sdk";

const MEDUSA_BACKEND_URL =
  // Preferir server env (prod) si existe; en cliente será undefined y seguirá a los NEXT_PUBLIC_*
  process.env.MEDUSA_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  "http://localhost:9000";

if (!process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY) {
  console.warn("[medusa-client] WARNING → falta NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY");
}

export const medusa = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
});

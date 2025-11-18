import Medusa from "@medusajs/js-sdk";

/**
 * Base URL del backend de Medusa
 * En producción siempre viene desde:
 * NEXT_PUBLIC_MEDUSA_BACKEND_URL
 */
const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";

/**
 * Advertencia útil en desarrollo si falta la variable.
 */
if (!process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL) {
  console.warn(
    "[medusa-client] WARNING → Falta NEXT_PUBLIC_MEDUSA_BACKEND_URL. Usando fallback:",
    MEDUSA_BACKEND_URL
  );
}

/**
 * Cliente oficial del SDK
 */
export const medusa = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: process.env.NODE_ENV === "development", // Log extra solo en dev
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
});

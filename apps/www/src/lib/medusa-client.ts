import Medusa from "@medusajs/js-sdk";

/**
 * Base URL del backend de Medusa.
 * Usamos múltiples opciones porque Railway a veces no pasa algunas envs.
 */
const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  "http://localhost:9000";

/**
 * Advertencia útil en desarrollo si falta la variable.
 */
if (
  !process.env.NEXT_PUBLIC_API_URL &&
  !process.env.NEXT_PUBLIC_BACKEND_URL &&
  !process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
) {
  console.warn(
    "[medusa-client] WARNING → No se encontró ninguna URL pública. Usando fallback:",
    MEDUSA_BACKEND_URL
  );
}

/**
 * Cliente oficial del SDK
 */
export const medusa = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
});

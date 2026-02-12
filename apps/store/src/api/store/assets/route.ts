/**
 * Sirve archivos estáticos (imágenes de productos/categorías) para que el frontend
 * pueda cargarlos en producción desde el backend de Medusa.
 *
 * GET /store/assets?path=img/productos/box/fresh.jpeg
 * - path: ruta relativa dentro de assets (sin /assets/ al inicio).
 */
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import path from "path";
import fs from "fs";

const ASSETS_DIR = process.env.STATIC_ASSETS_DIR || path.join(process.cwd(), "static-assets", "assets");

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const rawPath = (req.query?.path as string)?.trim();
  if (!rawPath) {
    res.status(400).json({ message: "Missing path query parameter" });
    return;
  }
  // Evitar path traversal: solo permitir segmentos que no contengan .. ni sean absolutos
  if (rawPath.includes("..") || path.isAbsolute(rawPath)) {
    res.status(400).json({ message: "Invalid path" });
    return;
  }
  const filePath = path.join(ASSETS_DIR, rawPath);
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(ASSETS_DIR))) {
    res.status(400).json({ message: "Invalid path" });
    return;
  }
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    res.status(404).json({ message: "Not found" });
    return;
  }
  const ext = path.extname(resolved).toLowerCase();
  const contentType = MIME[ext] || "application/octet-stream";
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "public, max-age=86400");
  const buffer = fs.readFileSync(resolved);
  res.send(buffer);
}

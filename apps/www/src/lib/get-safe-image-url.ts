/**
 * Devuelve una URL de imagen segura para usar en <Image src={...} />.
 * - Codifica rutas relativas (ej. & → %26).
 * - Si baseUrl está definida y la URL es relativa, devuelve URL absoluta.
 * - Si la URL apunta al endpoint de la API de R2 (r2.cloudflarestorage.com), la reescribe
 *   usando NEXT_PUBLIC_R2_PUBLIC_URL para que las imágenes carguen desde la URL pública (pub-xxx.r2.dev).
 */
export function getSafeImageUrl(
  url: string | undefined | null,
  baseUrl?: string,
): string {
  if (!url || typeof url !== 'string') return '';

  // Reescribir URLs de la API de R2 a la URL pública para que las imágenes se vean.
  // La API S3 devuelve path tipo /bucket-name/object-key; la URL pública de R2 (r2.dev) es solo /object-key.
  if (
    (url.startsWith('http://') || url.startsWith('https://')) &&
    url.includes('r2.cloudflarestorage.com')
  ) {
    const publicR2Base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
    if (publicR2Base) {
      try {
        const u = new URL(url);
        // Quitar el primer segmento del path (nombre del bucket) para la URL pública r2.dev
        const pathWithoutBucket = u.pathname.replace(/^\/[^/]+/, '') || u.pathname;
        return `${publicR2Base.replace(/\/$/, '')}${pathWithoutBucket}${u.search}`;
      } catch {
        return url;
      }
    }
  }

  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const encoded = encodeURI(url);
  if (baseUrl && url.startsWith('/')) {
    return `${baseUrl.replace(/\/$/, '')}${encoded}`;
  }
  return encoded;
}

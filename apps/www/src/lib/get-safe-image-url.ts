/**
 * Devuelve una URL de imagen segura para usar en <Image src={...} />.
 * - Codifica rutas relativas (ej. & → %26) para que no rompan la petición.
 * - Si baseUrl está definida y la URL es relativa, devuelve URL absoluta (para que en
 *   deploy las imágenes carguen desde el mismo origen).
 */
export function getSafeImageUrl(
  url: string | undefined | null,
  baseUrl?: string,
): string {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const encoded = encodeURI(url);
  if (baseUrl && url.startsWith('/')) {
    return `${baseUrl.replace(/\/$/, '')}${encoded}`;
  }
  return encoded;
}

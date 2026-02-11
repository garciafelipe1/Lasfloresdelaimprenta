/**
 * Devuelve una URL de imagen segura para usar en <Image src={...} />.
 * Codifica rutas relativas para que caracteres como & en el path no rompan la petición
 * (ej. /assets/img/productos/box/lilim&violet.jpeg → /assets/.../lilim%26violet.jpeg).
 */
export function getSafeImageUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return encodeURI(url);
}

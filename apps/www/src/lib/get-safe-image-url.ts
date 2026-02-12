/**
 * Devuelve una URL de imagen segura para usar en <Image src={...} />.
 * - Si la ruta es /assets/... y hay medusaBackendUrl, se sirve desde el backend de Medusa (producción).
 * - Si baseUrl está definida y la URL es relativa, devuelve URL absoluta.
 * - Codifica rutas relativas (ej. & → %26).
 */
export function getSafeImageUrl(
  url: string | undefined | null,
  baseUrl?: string,
  medusaBackendUrl?: string,
): string {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // En producción, /assets/ se sirve desde Medusa para que las imágenes siempre carguen
  if (url.startsWith('/assets/') && medusaBackendUrl) {
    const pathParam = url.slice(8); // quitar "/assets/"
    return `${medusaBackendUrl.replace(/\/$/, '')}/store/assets?path=${encodeURIComponent(pathParam)}`;
  }
  const encoded = encodeURI(url);
  if (baseUrl && url.startsWith('/')) {
    return `${baseUrl.replace(/\/$/, '')}${encoded}`;
  }
  return encoded;
}

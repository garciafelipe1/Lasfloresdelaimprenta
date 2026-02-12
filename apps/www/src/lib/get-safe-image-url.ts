/** URL pública de R2 (fallback si no está la env en build). */
const R2_PUBLIC_URL_FALLBACK = 'https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev';

function getR2PublicBase(): string {
  return (
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_R2_PUBLIC_URL) ||
    R2_PUBLIC_URL_FALLBACK
  );
}

/**
 * Devuelve una URL de imagen segura para usar en <Image src={...} />.
 * - Codifica rutas relativas (ej. & → %26).
 * - Si baseUrl está definida y la URL es relativa, devuelve URL absoluta.
 * - Si la URL apunta al endpoint de la API de R2 (r2.cloudflarestorage.com), la reescribe a la URL pública.
 * - Si la URL viene como "undefined/KEY" (Medusa sin base configurada), la corrige con la URL pública de R2.
 * - Si la URL es solo la key (ej. IMG-xxx.jpeg), la convierte en URL absoluta de R2.
 */
export function getSafeImageUrl(
  url: string | undefined | null,
  baseUrl?: string,
): string {
  if (!url || typeof url !== 'string') return '';

  // Corregir "undefined/KEY" que devuelve Medusa cuando no tiene base URL configurada
  if (url.startsWith('undefined/')) {
    const key = url.slice('undefined/'.length);
    return `${getR2PublicBase().replace(/\/$/, '')}/${encodeURI(key)}`;
  }

  // Reescribir URLs de la API de R2 a la URL pública
  if (
    (url.startsWith('http://') || url.startsWith('https://')) &&
    url.includes('r2.cloudflarestorage.com')
  ) {
    try {
      const u = new URL(url);
      return `${getR2PublicBase().replace(/\/$/, '')}${u.pathname}${u.search}`;
    } catch {
      return url;
    }
  }

  if (url.startsWith('http://') || url.startsWith('https://')) return url;

  // URL que es solo la key de R2 (sin protocolo ni / inicial) → usar URL pública de R2
  if (!url.startsWith('/') && url.length > 0 && !url.includes(' ')) {
    return `${getR2PublicBase().replace(/\/$/, '')}/${encodeURI(url)}`;
  }

  const encoded = encodeURI(url);
  if (baseUrl && url.startsWith('/')) {
    return `${baseUrl.replace(/\/$/, '')}${encoded}`;
  }
  return encoded;
}

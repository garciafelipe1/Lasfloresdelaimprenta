/**
 * Redirecciones SEO-friendly para categorías migradas
 * 
 * Estas redirecciones 301 preservan el SEO cuando se cambian nombres de categorías
 */

export const CATEGORY_REDIRECTS: Record<string, string> = {
  // Redirecciones de "Follaje" a "Día de la Mujer"
  '/catalog?category=Follaje': '/catalog?category=Día+de+la+Mujer',
  '/es/ar/catalog?category=Follaje': '/es/ar/catalog?category=Día+de+la+Mujer',
  '/en/ar/catalog?category=Follaje': '/en/ar/catalog?category=Día+de+la+Mujer',
  // Redirecciones de "Bodas" a "Día de la Mujer"
  '/catalog?category=Bodas': '/catalog?category=Día+de+la+Mujer',
  '/es/ar/catalog?category=Bodas': '/es/ar/catalog?category=Día+de+la+Mujer',
  '/en/ar/catalog?category=Bodas': '/en/ar/catalog?category=Día+de+la+Mujer',
};

/**
 * Verifica si una URL necesita redirección de categoría
 * Retorna la nueva URL o null si no necesita redirección
 */
export function getCategoryRedirect(pathname: string, searchParams: URLSearchParams): string | null {
  const category = searchParams.get('category');

  if (category === 'Follaje' || category === 'Bodas') {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('category', 'Día de la Mujer');
    return `${pathname}?${newSearchParams.toString()}`;
  }

  if (category === 'Diseños exclusivos') {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('category');
    const qs = newSearchParams.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return null;
}

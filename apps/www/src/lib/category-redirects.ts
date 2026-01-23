/**
 * Redirecciones SEO-friendly para categorías migradas
 * 
 * Estas redirecciones 301 preservan el SEO cuando se cambian nombres de categorías
 */

export const CATEGORY_REDIRECTS: Record<string, string> = {
  // Redirecciones de "Follaje" a "San Valentín"
  '/catalog?category=Follaje': '/catalog?category=San+Valentín',
  '/es/ar/catalog?category=Follaje': '/es/ar/catalog?category=San+Valentín',
  '/en/ar/catalog?category=Follaje': '/en/ar/catalog?category=San+Valentín',
  // Redirecciones de "Bodas" a "San Valentín"
  '/catalog?category=Bodas': '/catalog?category=San+Valentín',
  '/es/ar/catalog?category=Bodas': '/es/ar/catalog?category=San+Valentín',
  '/en/ar/catalog?category=Bodas': '/en/ar/catalog?category=San+Valentín',
};

/**
 * Verifica si una URL necesita redirección de categoría
 * Retorna la nueva URL o null si no necesita redirección
 */
export function getCategoryRedirect(pathname: string, searchParams: URLSearchParams): string | null {
  const category = searchParams.get('category');
  
  if (category === 'Follaje' || category === 'Bodas') {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('category', 'San Valentín');
    return `${pathname}?${newSearchParams.toString()}`;
  }
  
  return null;
}

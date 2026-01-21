/**
 * Redirecciones SEO-friendly para categorías migradas
 * 
 * Estas redirecciones 301 preservan el SEO cuando se cambian nombres de categorías
 */

export const CATEGORY_REDIRECTS: Record<string, string> = {
  // Redirecciones de "Follaje" a "Bodas"
  '/catalog?category=Follaje': '/catalog?category=Bodas',
  '/es/ar/catalog?category=Follaje': '/es/ar/catalog?category=Bodas',
  '/en/ar/catalog?category=Follaje': '/en/ar/catalog?category=Bodas',
};

/**
 * Verifica si una URL necesita redirección de categoría
 * Retorna la nueva URL o null si no necesita redirección
 */
export function getCategoryRedirect(pathname: string, searchParams: URLSearchParams): string | null {
  const category = searchParams.get('category');
  
  if (category === 'Follaje') {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('category', 'Bodas');
    return `${pathname}?${newSearchParams.toString()}`;
  }
  
  return null;
}

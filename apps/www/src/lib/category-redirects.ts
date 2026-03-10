/**
 * Redirecciones SEO-friendly para categorías migradas
 * 
 * Estas redirecciones 301 preservan el SEO cuando se cambian nombres de categorías
 */

export const CATEGORY_REDIRECTS: Record<string, string> = {
  // Redirecciones de "Follaje" a "Diseños Exclusivos"
  '/catalog?category=Follaje': '/catalog?category=Diseños+Exclusivos',
  '/es/ar/catalog?category=Follaje': '/es/ar/catalog?category=Diseños+Exclusivos',
  '/en/ar/catalog?category=Follaje': '/en/ar/catalog?category=Diseños+Exclusivos',
  // Redirecciones de "Bodas" a "Diseños Exclusivos"
  '/catalog?category=Bodas': '/catalog?category=Diseños+Exclusivos',
  '/es/ar/catalog?category=Bodas': '/es/ar/catalog?category=Diseños+Exclusivos',
  '/en/ar/catalog?category=Bodas': '/en/ar/catalog?category=Diseños+Exclusivos',
};

/**
 * Verifica si una URL necesita redirección de categoría
 * Retorna la nueva URL o null si no necesita redirección
 */
export function getCategoryRedirect(pathname: string, searchParams: URLSearchParams): string | null {
  const category = searchParams.get('category');

  if (category === 'Follaje' || category === 'Bodas') {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('category', 'Diseños Exclusivos');
    return `${pathname}?${newSearchParams.toString()}`;
  }

  return null;
}

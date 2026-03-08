/**
 * Mapeo de categorías para compatibilidad y migración
 *
 * "Día de la Mujer": solo productos de esa categoría (filtro estricto en catálogo).
 * "Bodas" / "Follaje": se expanden para mostrar también productos de Día de la Mujer (URLs antiguas).
 */
export const CATEGORY_ALIASES = {
  "Día de la Mujer": ["Día de la Mujer"],
  "Bodas": ["Día de la Mujer", "Bodas", "Follaje"],
  "Follaje": ["Día de la Mujer", "Bodas", "Follaje"],
} as const;

/**
 * Redirecciones SEO-friendly de URLs antiguas a nuevas
 * Usar 301 redirects para preservar SEO
 */
export const CATEGORY_REDIRECTS = {
  "/catalog?category=Follaje": "/catalog?category=Bodas",
  "/es/ar/catalog?category=Follaje": "/es/ar/catalog?category=Bodas",
  "/en/ar/catalog?category=Follaje": "/en/ar/catalog?category=Bodas",
} as const;

/**
 * Obtiene las categorías expandidas (incluyendo aliases) para una categoría dada
 */
export function getExpandedCategories(categoryName: string): string[] {
  const aliases = CATEGORY_ALIASES[categoryName as keyof typeof CATEGORY_ALIASES];
  // Hacer una copia del array para convertir de readonly a mutable
  return aliases ? [...aliases] : [categoryName];
}

/**
 * Verifica si una categoría tiene aliases configurados
 */
export function hasCategoryAliases(categoryName: string): boolean {
  return categoryName in CATEGORY_ALIASES;
}

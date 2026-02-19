/**
 * Mapeo de categorías para compatibilidad y migración
 * 
 * Permite que productos con categoría "Bodas" o "Follaje" aparezcan cuando se busca "Día de la Mujer"
 * y viceversa, manteniendo compatibilidad durante la migración.
 */
export const CATEGORY_ALIASES = {
  // Mapeo bidireccional: "Día de la Mujer" incluye productos de "Bodas" y "Follaje"
  "Día de la Mujer": ["Día de la Mujer", "Bodas", "Follaje"],
  "Bodas": ["Día de la Mujer", "Bodas", "Follaje"], // Redirige a "Día de la Mujer"
  "Follaje": ["Día de la Mujer", "Bodas", "Follaje"], // Mantener compatibilidad temporal
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

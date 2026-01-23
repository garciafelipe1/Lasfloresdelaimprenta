/**
 * Servicio de traducción de productos
 * 
 * Mapea productos por handle a sus traducciones según el locale.
 * Si no existe traducción, devuelve el valor original.
 */

type ProductTranslation = {
  title?: string;
  description?: string;
};

type ProductTranslations = Record<string, ProductTranslation>;

let translationsCache: {
  es: ProductTranslations | null;
  en: ProductTranslations | null;
} = {
  es: null,
  en: null,
};

/**
 * Carga las traducciones de productos para un locale específico
 */
async function loadProductTranslations(locale: 'es' | 'en'): Promise<ProductTranslations> {
  if (translationsCache[locale]) {
    return translationsCache[locale]!;
  }

  try {
    const translations = await import(`../../messages/products/products-${locale}.json`);
    translationsCache[locale] = translations.default || translations;
    return translationsCache[locale]!;
  } catch (error) {
    console.warn(`[ProductTranslations] No se encontraron traducciones para locale ${locale}, usando valores por defecto`);
    return {};
  }
}

/**
 * Obtiene la traducción de un producto por su handle
 */
export async function getProductTranslation(
  handle: string,
  locale: 'es' | 'en',
  field: 'title' | 'description'
): Promise<string | undefined> {
  const translations = await loadProductTranslations(locale);
  return translations[handle]?.[field];
}

/**
 * Aplica traducciones a un producto completo
 */
export async function translateProduct<T extends { handle: string; title: string; description?: string | null }>(
  product: T,
  locale: 'es' | 'en'
): Promise<T> {
  // Si el locale es español, no traducir (es el idioma base)
  if (locale === 'es') {
    return product;
  }

  const translations = await loadProductTranslations(locale);
  const translation = translations[product.handle];

  if (!translation) {
    // Si no hay traducción, devolver el producto original
    return product;
  }

  return {
    ...product,
    title: translation.title ?? product.title,
    description: translation.description ?? product.description ?? null,
  };
}

/**
 * Aplica traducciones a un array de productos
 */
export async function translateProducts<T extends { handle: string; title: string; description?: string | null }>(
  products: T[],
  locale: 'es' | 'en'
): Promise<T[]> {
  if (locale === 'es') {
    return products;
  }

  const translations = await loadProductTranslations(locale);
  
  return products.map((product) => {
    const translation = translations[product.handle];
    if (!translation) {
      return product;
    }

    return {
      ...product,
      title: translation.title ?? product.title,
      description: translation.description ?? product.description ?? null,
    };
  });
}

/**
 * Utilidades para manejo de moneda basado en locale
 * 
 * Reglas de negocio:
 * - locale === 'es' → currency = 'ARS'
 * - locale === 'en' → currency = 'USD'
 */

export type CurrencyCode = 'ars' | 'usd';

/**
 * Obtiene el código de moneda basado en el locale
 */
export function getCurrencyFromLocale(locale: string): CurrencyCode {
  return locale === 'en' ? 'usd' : 'ars';
}

/**
 * Obtiene el locale basado en el código de moneda
 */
export function getLocaleFromCurrency(currency: CurrencyCode): string {
  return currency === 'usd' ? 'en' : 'es';
}

/**
 * Verifica si un locale es válido para el sistema de monedas
 */
export function isValidLocale(locale: string): boolean {
  return locale === 'es' || locale === 'en';
}

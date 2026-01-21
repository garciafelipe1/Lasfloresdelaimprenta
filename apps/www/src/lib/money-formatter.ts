import { formatARS, formatUSD } from 'utils';
import { getCurrencyFromLocale } from './currency';

/**
 * Formatea un monto según el locale actual
 * 
 * @param amount - Monto en centavos (formato Medusa)
 * @param locale - Locale actual ('es' o 'en')
 * @returns String formateado con símbolo de moneda
 */
export function formatMoneyByLocale(
  amount: number | string,
  locale: string
): string {
  const currency = getCurrencyFromLocale(locale);
  
  if (currency === 'usd') {
    return formatUSD(amount);
  }
  
  return formatARS(amount);
}

/**
 * Formatea un monto para emails y notificaciones
 * Usa el mismo formateo pero puede ser extendido para formato específico de email
 */
export function formatMoneyForEmail(
  amount: number | string,
  locale: string
): string {
  return formatMoneyByLocale(amount, locale);
}

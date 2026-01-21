'use client';

import { formatMoneyByLocale } from '@/lib/money-formatter';
import { useLocale } from 'next-intl';

interface PriceDisplayProps {
  amount: number | string;
  className?: string;
  showCurrency?: boolean;
}

/**
 * Componente cliente para mostrar precios formateados según el locale
 * 
 * Uso:
 * <PriceDisplay amount={150000} /> // Muestra $1,500.00 ARS o $15.00 USD según locale
 */
export function PriceDisplay({ 
  amount, 
  className,
  showCurrency = true 
}: PriceDisplayProps) {
  const locale = useLocale();
  const formattedPrice = formatMoneyByLocale(amount, locale);

  return (
    <span className={className}>
      {formattedPrice}
    </span>
  );
}

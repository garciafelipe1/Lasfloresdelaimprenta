'use client';

import { useEffect, useRef } from 'react';

const getGoogleAdsSendTo = () => {
  if (typeof window === 'undefined') return undefined;
  const id = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || 'AW-17907094471';
  const label = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL?.trim();
  return label ? `${id}/${label}` : id;
};

/**
 * Dispara evento Purchase de Facebook Pixel y conversión de Google Ads
 * cuando el usuario llega a la página de éxito de pago.
 */
export function PurchaseTracking({
  value,
  currency = 'ARS',
  orderId,
  approved = true,
}: {
  value: number;
  currency?: string;
  orderId?: string;
  approved?: boolean;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (!approved || value <= 0 || fired.current) return;
    fired.current = true;

    if (typeof window === 'undefined') return;

    if ((window as any).fbq) {
      (window as any).fbq('track', 'Purchase', {
        value,
        currency,
        content_type: 'product',
        ...(orderId ? { order_id: orderId } : {}),
      });
    }

    const sendTo = getGoogleAdsSendTo();
    if ((window as any).gtag && sendTo) {
      (window as any).gtag('event', 'conversion', {
        send_to: sendTo,
        value,
        currency,
        transaction_id: orderId,
      });
    }
  }, [value, currency, orderId, approved]);

  return null;
}

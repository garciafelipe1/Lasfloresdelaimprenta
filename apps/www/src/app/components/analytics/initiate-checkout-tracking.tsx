'use client';

import { useEffect, useRef } from 'react';

/**
 * Dispara InitiateCheckout de Facebook Pixel cuando el usuario entra al flujo de checkout.
 * Se monta una sola vez en el layout del checkout.
 */
export function InitiateCheckoutTracking() {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'InitiateCheckout');
    }
  }, []);

  return null;
}

'use client';

import { HttpTypes } from '@medusajs/types';
import { initMercadoPago } from '@mercadopago/sdk-react';
import { createContext, PropsWithChildren, useEffect } from 'react';

type Props = PropsWithChildren & {
  paymentSession?: HttpTypes.StorePaymentSession;
  mercadopagoKey?: string;
};

const MercadopagoContext = createContext(false);

export function MercadoPagoProvider({ children, mercadopagoKey }: Props) {
  if (!mercadopagoKey) {
    throw new Error('Missing mercado pago public key');
  }

  useEffect(() => {
    //@ts-expect-error va a explotar
    if (!window.MercadoPago) {
      initMercadoPago(mercadopagoKey);
    }
  }, [mercadopagoKey]);

  return (
    <MercadopagoContext.Provider value={true}>
      {children}
    </MercadopagoContext.Provider>
  );
}

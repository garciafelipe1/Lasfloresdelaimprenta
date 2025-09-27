import envs from '@/config/envs';
import { MercadoPagoConfig } from 'mercadopago';

export const mercadoPagoClient = new MercadoPagoConfig({
  accessToken: envs.MERCADO_PAGO.TOKEN,
});

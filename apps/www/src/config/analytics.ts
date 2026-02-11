/**
 * Configuración de analytics (Meta, Google Ads, GA4).
 * Las variables deben definirse en .env (ver docs/ENV-ANALYTICS.md).
 * En desarrollo los scripts no se cargan para no contaminar datos.
 */

const isProduction = process.env.NODE_ENV === 'production';

export const analytics = {
  /** Cargar pixels/scripts solo en producción (o si forzás con NEXT_PUBLIC_ANALYTICS_ENABLED=true) */
  get enabled(): boolean {
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true') return true;
    return isProduction;
  },

  /** ID de Google Ads (ej: AW-17907094471) */
  get googleAdsId(): string | undefined {
    return process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || undefined;
  },

  /** Label de la acción de conversión de compra (opcional). Ej: "AbCdEf" → send_to = AW-17907094471/AbCdEf */
  get googleAdsConversionLabel(): string | undefined {
    return process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL || undefined;
  },

  /** send_to para evento de compra: AW-XXX o AW-XXX/Label */
  get googleAdsPurchaseSendTo(): string | undefined {
    const id = this.googleAdsId;
    if (!id) return undefined;
    const label = this.googleAdsConversionLabel?.trim();
    return label ? `${id}/${label}` : id;
  },

  /** ID del Pixel de Meta/Facebook (ej: 1579891879827288) */
  get facebookPixelId(): string | undefined {
    return process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || undefined;
  },

  /** ID de medición de Google Analytics 4 (opcional). Ej: G-XXXXXXXXXX */
  get ga4MeasurementId(): string | undefined {
    return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || undefined;
  },

  /** Código de verificación de Google Search Console (meta tag). Ej: Y6qftxiqfFQbxtKIv9fzWhdNfWIinLmAVuCLxjHPn4I */
  get googleVerification(): string | undefined {
    return process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || undefined;
  },
} as const;

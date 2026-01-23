import { getRequestConfig } from 'next-intl/server';
import { Locale, routing } from './routing';

// @ts-expect-error i18n error
export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }

  const categoriesProducts = await import(`../../messages/${locale}/categories-products.json`);
  const productTranslations = await import(`../../messages/products/products-${locale}.json`);

  return {
    locale,
    messages: {
      ...(await import(`../../messages/${locale}/landing.json`)),
      ...(await import(`../../messages/${locale}/auth.json`)),
      ...(await import(`../../messages/${locale}/services.json`)),
      ...(await import(`../../messages/${locale}/membership.json`)),
      ...(await import(`../../messages/${locale}/dashboard.json`)),
      ...(await import(`../../messages/${locale}/navbar.json`)),
      ...(await import(`../../messages/${locale}/cart.json`)),
      'categories-products': categoriesProducts.default || categoriesProducts,
      'products': productTranslations.default || productTranslations,
    },
  };
});

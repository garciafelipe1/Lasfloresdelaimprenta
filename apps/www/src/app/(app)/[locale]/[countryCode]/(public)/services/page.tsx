import { getTranslations } from 'next-intl/server';
import ServiceSection from './_components/service-section';

export default async function page() {
  const t = await getTranslations('services');

  const sampleImages: string[] = new Array(4).fill('/assets/img/service.webp');

  return (
    <>
      <ServiceSection
        hash='eventosflorales'
        slug='eventos-florales'
        description={t.raw('Servicio1.description')}
        images={sampleImages}
        subtitle={t('Servicio1.subtitle')}
        title={t('Servicio1.title')}
        translations={{
          viewDetails: t('common.viewDetails'),
          requestQuote: t('common.requestQuote'),
          premiumService: t('common.premiumService'),
        }}
      />
      <ServiceSection
        hash='bodas'
        slug='bodas'
        description={t.raw('Servicio2.description')}
        images={sampleImages}
        subtitle={t('Servicio2.subtitle')}
        title={t('Servicio2.title')}
        translations={{
          viewDetails: t('common.viewDetails'),
          requestQuote: t('common.requestQuote'),
          premiumService: t('common.premiumService'),
        }}
      />
    </>
  );
}

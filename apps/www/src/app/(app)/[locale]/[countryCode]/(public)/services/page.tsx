import { getTranslations } from 'next-intl/server';
import ServiceSection from './_components/service-section';

export default async function page() {
  const t = await getTranslations('services');

  const IMAGES_V = '20260205';
  const eventosGeneralesImages: string[] = [
    `/assets/img/services/eventosgenerales/3c5bf702-e89f-4723-996f-2c25630bc9aa.jpg?v=${IMAGES_V}`,
    `/assets/img/services/eventosgenerales/42ea27e3-3910-41a5-aeaa-4488884cb117.jpg?v=${IMAGES_V}`,
    `/assets/img/services/eventosgenerales/63811fed-49b6-4a85-b66b-ff757ba91719.jpg?v=${IMAGES_V}`,
    `/assets/img/services/eventosgenerales/854fb53c-1c81-41dc-8d7e-7a459b2ef42a.jpg?v=${IMAGES_V}`,
    `/assets/img/services/eventosgenerales/99009a6f-077e-4397-9523-860a3c60fa4a.jpg?v=${IMAGES_V}`,
  ];

  const sampleImages: string[] = new Array(4).fill('/assets/img/service.webp');

  return (
    <>
      <ServiceSection
        hash='eventosflorales'
        slug='eventos-florales'
        description={t.raw('Servicio1.description')}
        images={eventosGeneralesImages.slice(0, 4)}
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

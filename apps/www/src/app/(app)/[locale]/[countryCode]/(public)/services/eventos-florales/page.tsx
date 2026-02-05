import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import ServiceDetailPage from '../_components/service-detail-page';

type Props = {
  params: Promise<{
    locale: string;
    countryCode: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: 'en' | 'es' = rawLocale === 'en' ? 'en' : 'es';
  const t = await getTranslations({ locale, namespace: 'services' as const });
  const IMAGES_V = '20260205';
  const ogImage = `/assets/img/services/eventosgenerales/3c5bf702-e89f-4723-996f-2c25630bc9aa.jpg?v=${IMAGES_V}`;

  return {
    title: `${t('Servicio1.title')} | La Florería de la Imprenta`,
    description: t('Servicio1.subtitle'),
    openGraph: {
      title: t('Servicio1.title'),
      description: t('Servicio1.subtitle'),
      images: [ogImage],
    },
    alternates: {
      canonical: `/${locale}/ar/services/eventos-florales`,
      languages: {
        'es-AR': '/es/ar/services/eventos-florales',
        'en-US': '/en/ar/services/eventos-florales',
      },
    },
  };
}

export default async function EventosFloralesPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale: 'en' | 'es' = rawLocale === 'en' ? 'en' : 'es';
  const t = await getTranslations({ locale, namespace: 'services' as const });
  const IMAGES_V = '20260205';
  const eventosGeneralesImages: string[] = [
    `/assets/img/services/eventosgenerales/3c5bf702-e89f-4723-996f-2c25630bc9aa.jpg?v=${IMAGES_V}`,
    `/assets/img/services/eventosgenerales/42ea27e3-3910-41a5-aeaa-4488884cb117.jpg?v=${IMAGES_V}`,
    `/assets/img/services/eventosgenerales/63811fed-49b6-4a85-b66b-ff757ba91719.jpg?v=${IMAGES_V}`,
    `/assets/img/services/eventosgenerales/854fb53c-1c81-41dc-8d7e-7a459b2ef42a.jpg?v=${IMAGES_V}`,
    `/assets/img/services/eventosgenerales/99009a6f-077e-4397-9523-860a3c60fa4a.jpg?v=${IMAGES_V}`,
  ];

  const benefits = [
    t('Servicio1.benefit1'),
    t('Servicio1.benefit2'),
    t('Servicio1.benefit3'),
  ];

  const features = [
    t('Servicio1.feature1'),
    t('Servicio1.feature2'),
    t('Servicio1.feature3'),
    t('Servicio1.feature4'),
  ];

  return (
    <ServiceDetailPage
      slug='eventos-florales'
      locale={locale}
      title={t('Servicio1.title')}
      subtitle={t('Servicio1.subtitle')}
      description={t.raw('Servicio1.description')}
      images={eventosGeneralesImages}
      ctaText={t('Servicio1.cta')}
      benefits={benefits}
      features={features}
      translations={{
        whyChooseUs: t('common.whyChooseUs'),
        ourWork: t('common.ourWork'),
        whatIncludes: t('common.whatIncludes'),
        readyToTransform: t('common.readyToTransform'),
        contactToday: t('common.contactToday'),
        callNow: t('common.callNow'),
        sendEmail: t('common.sendEmail'),
        requestQuote: t('common.requestQuote'),
        viewGallery: t('common.viewGallery'),
        premiumService: t('common.premiumService'),
      }}
    />
  );
}

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
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services' });

  return {
    title: `${t('Servicio1.title')} | La Florería de la Imprenta`,
    description: t('Servicio1.subtitle'),
    openGraph: {
      title: t('Servicio1.title'),
      description: t('Servicio1.subtitle'),
      images: ['/assets/img/service.webp'],
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
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services' });
  const sampleImages: string[] = new Array(4).fill('/assets/img/service.webp');

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
      images={sampleImages}
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

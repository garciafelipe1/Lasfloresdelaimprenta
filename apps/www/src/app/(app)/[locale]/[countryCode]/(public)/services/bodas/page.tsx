import { PhotoBanner } from '@/app/components/common/photo-banner/photo-banner';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import ServiceDetailPage from '../_components/service-detail-page';

/** Foto del banner de cierre en Bodas. Cambiá esta ruta para usar otra imagen. */
const BODAS_BANNER_IMAGE = 'https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/bannerservicios.jpg';

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

  return {
    title: `${t('Servicio2.title')} | La Florería de la Imprenta`,
    description: t('Servicio2.subtitle'),
    openGraph: {
      title: t('Servicio2.title'),
      description: t('Servicio2.subtitle'),
      images: ['/assets/img/services/bodas/bodas-3.png'],

    },
    alternates: {
      canonical: `/${locale}/ar/services/bodas`,
      languages: {
        'es-AR': '/es/ar/services/bodas',
        'en-US': '/en/ar/services/bodas',
      },
    },
  };
}

export default async function BodasPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale: 'en' | 'es' = rawLocale === 'en' ? 'en' : 'es';
  const t = await getTranslations({ locale, namespace: 'services' as const });
  const images: string[] = [
    '/assets/img/services/bodas/bodas-3.png',
    '/assets/img/services/bodas/bodas-4.png',
    '/assets/img/services/bodas/bodas-7.png',
    '/assets/img/services/bodas/bodas-8.png',
    '/assets/img/services/bodas/bodas-5.png',
  ];

  const benefits = [
    t('Servicio2.benefit1'),
    t('Servicio2.benefit2'),
    t('Servicio2.benefit3'),
  ];

  const features = [
    t('Servicio2.feature1'),
    t('Servicio2.feature2'),
    t('Servicio2.feature3'),
    t('Servicio2.feature4'),
  ];

  return (
    <>
      <ServiceDetailPage
        slug='bodas'
        locale={locale}
        title={t('Servicio2.title')}
        subtitle={t('Servicio2.subtitle')}
        description={t.raw('Servicio2.description')}
        images={images}
        ctaText={t('Servicio2.cta')}
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
      <PhotoBanner src={BODAS_BANNER_IMAGE} wide />
    </>
  );
}

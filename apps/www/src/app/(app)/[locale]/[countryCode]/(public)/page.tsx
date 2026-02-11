import { AboutUs } from '@/app/components/landing/about-us';
import { Categories } from '@/app/components/landing/categories';
import { Examples } from '@/app/components/landing/examples';
import { ExamplesSkeleton } from '@/app/components/landing/examples.skeleton';
import { Hero } from '@/app/components/landing/hero';
import { Memberships } from '@/app/components/landing/memberships';
import { Questions } from '@/app/components/landing/questions';
// import { Testimonials } from '@/app/components/landing/testimonials';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'La Florería de la Imprenta ',
  description:
    'Descubre arreglos florales frescos, ramos personalizados y flores para cada ocasión en La Florería de la Imprenta. Envío a domicilio en Bahía Blanca.', // Descripción que aparece bajo el título en los resultados de búsqueda
  keywords: [
    'floreria',
    'flores',
    'ramos',
    'arreglos florales',
    'Bahía Blanca',
    'envio de flores',
    'floreria a domicilio',
  ],
  openGraph: {
    title: 'La Florería de la Imprenta',
    description:
      'Flores frescas y arreglos florales únicos para todas tus ocasiones especiales. Envío a domicilio en Bahía Blanca.',
    url: 'https://www.lasfloresdelaimprenta.com/es/ar',
    siteName: 'La Florería de la Imprenta',
    images: [
      {
        url: '',
        width: 1200,
        height: 630,
        alt: 'La Florería de la Imprenta - Flores frescas',
      },
    ],
    locale: 'es_AR',
    type: 'website',
  },
};

export default async function Home() {
  return (
    <div className='landing overflow-x-hidden'>
      <Hero />
      <Categories />
      <Suspense fallback={<ExamplesSkeleton />}>
        <Examples />
      </Suspense>
      <AboutUs />
      <Memberships />

      {/* <Testimonials /> */}
      <Questions />
    </div>
  );
}

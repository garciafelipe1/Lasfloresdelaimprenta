import { getSafeImageUrl } from '@/lib/get-safe-image-url';
import { listRegions } from '@/lib/data/regions';
import { medusa } from '@/lib/medusa-client';
import { getLocale } from 'next-intl/server';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { FooterBanner } from './_components/footer-banner';
import { ProductInfo } from './_components/product/product-info';
import { ProductSkeleton } from './_components/product/product.skeleton';
import { RecommendedProducts } from './_components/recommended/recommended-products';
import { RecommendedProductsSkeleton } from './_components/recommended/recommended-products.skeleton';

interface Props {
  params: Promise<{
    handle: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const locale = await getLocale();

  let product;
  try {
    const { products } = await medusa.store.product.list({
      handle: [handle],
    });
    product = products[0];
  } catch (error) {
    console.error(
      `[generateMetadata] Error al buscar producto para handle ${handle}:`,
      error,
    );
    const notFoundTitle = locale === 'en'
      ? 'Product not found - La Florería de la Imprenta'
      : 'Producto no encontrado - La Florería de la Imprenta';
    const notFoundDesc = locale === 'en'
      ? 'The product you are looking for is not available or does not exist.'
      : 'El producto que buscas no está disponible o no existe.';
    return {
      title: notFoundTitle,
      description: notFoundDesc,
      robots: 'noindex, nofollow',
    };
  }

  if (!product) {
    console.log(
      `[generateMetadata] Producto no encontrado para handle: ${handle}`,
    );
    const notFoundTitle = locale === 'en'
      ? 'Product not found - La Florería de la Imprenta'
      : 'Producto no encontrado - La Florería de la Imprenta';
    const notFoundDesc = locale === 'en'
      ? 'The product you are looking for is not available or does not exist.'
      : 'El producto que buscas no está disponible o no existe.';
    return {
      title: notFoundTitle,
      description: notFoundDesc,
      robots: 'noindex, nofollow',
    };
  }

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const productUrl = `${BASE_URL}/${locale}/ar/products/${product.handle}`;
  const rawImage = product.images?.[0]?.url ?? product.thumbnail;
  const initialImage = rawImage
    ? (rawImage.startsWith('http') ? rawImage : `${BASE_URL}${getSafeImageUrl(rawImage)}`)
    : undefined;

  const siteName = 'La Florería de la Imprenta';
  const title = `${product.title} - ${siteName}`;
  const description = product.description ?? (
    locale === 'en'
      ? `Buy ${product.title} at La Florería de la Imprenta. Fresh flowers and floral arrangements with home delivery in Bahía Blanca.`
      : `Comprar ${product.title} en La Florería de la Imprenta. Flores frescas y arreglos florales con envío a domicilio en Bahía Blanca.`
  );
  const ogDescription = product.description ?? (
    locale === 'en'
      ? `Find ${product.title} and other unique floral arrangements in Bahía Blanca.`
      : `Encuentra el ${product.title} y otros arreglos florales únicos en Bahía Blanca.`
  );

  const metadataOutput: Metadata = {
    title,
    description,
    keywords: [
      product.title,
      locale === 'en' ? 'flowers' : 'flores',
      locale === 'en' ? 'bouquets' : 'ramos',
      'Bahía Blanca',
      locale === 'en' ? 'home delivery' : 'envio a domicilio',
      product.collection?.title ?? (locale === 'en' ? 'florist' : 'florería'),
    ].filter(Boolean) as string[],

    openGraph: {
      title,
      description: ogDescription,
      url: productUrl,
      siteName,
      images: initialImage
        ? [{ url: initialImage, alt: product.title ?? (locale === 'en' ? 'Product image' : 'Imagen de producto') }]
        : [],
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'es_AR',
    },
    alternates: {
      canonical: productUrl,
    },
  };

  return metadataOutput;
}

export async function generateStaticParams() {
  try {
    const countryCodes = await listRegions().then((regions) =>
      regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat(),
    );

    if (!countryCodes) {
      return [];
    }

    const { products } = await medusa.store.product.list(
      { fields: 'handle' },
      { next: { tags: ['products'] } },
    );

    return countryCodes
      .map((countryCode) =>
        products.map((product) => ({
          countryCode,
          handle: product.handle,
        })),
      )
      .flat()
      .filter((param) => param.handle);
  } catch (error) {
    console.error(
      `Failed to generate static paths for product pages: ${error instanceof Error ? error.message : 'Unknown error'
      }.`,
    );
    return [];
  }
}

export default async function ProductPage(props: Props) {
  const params = await props.params;

  return (
    <section className='px-layout flex flex-col gap-12 py-12'>
      <Suspense fallback={<ProductSkeleton />}>
        <ProductInfo handle={params.handle} />
      </Suspense>
      <Suspense fallback={<RecommendedProductsSkeleton />}>
        <RecommendedProducts handle={params.handle} />
      </Suspense>
      <FooterBanner />
    </section>
  );
}

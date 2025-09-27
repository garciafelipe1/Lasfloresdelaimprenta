import { listRegions } from '@/lib/data/regions';
import { medusa } from '@/lib/medusa-client';
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
    return {
      title: 'Producto no encontrado - La Florería de la Imprenta',
      description: 'El producto que buscas no está disponible o no existe.',
      robots: 'noindex, nofollow',
    };
  }

  if (!product) {
    console.log(
      `[generateMetadata] Producto no encontrado para handle: ${handle}`,
    );
    return {
      title: 'Producto no encontrado - La Florería de la Imprenta',
      description: 'El producto que buscas no está disponible o no existe.',
      robots: 'noindex, nofollow',
    };
  }

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const productUrl = `${BASE_URL}/products/${product.handle}`;
  const initialImage = product.images?.[0]?.url;

  const metadataOutput: Metadata = {
    title: `${product.title} - La Florería de la Imprenta`,
    description:
      product.description ??
      `Comprar ${product.title} en La Florería de la Imprenta. Flores frescas y arreglos florales con envío a domicilio en Bahía Blanca.`,
    keywords: [
      product.title,
      'flores',
      'ramos',
      'Bahía Blanca',
      'envio a domicilio',

      product.collection?.title ?? 'florería',
    ].filter(Boolean) as string[],

    openGraph: {
      title: `${product.title} - La Florería de la Imprenta`,
      description:
        product.description ??
        `Encuentra el ${product.title} y otros arreglos florales únicos en Bahía Blanca.`,
      url: productUrl,
      siteName: 'La Florería de la Imprenta',
      images: initialImage
        ? [{ url: initialImage, alt: product.title ?? 'Imagen de producto' }]
        : [],
      type: 'website',
      locale: 'es_AR',
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
      `Failed to generate static paths for product pages: ${
        error instanceof Error ? error.message : 'Unknown error'
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

import {
  Section,
  SectionHeader,
  SectionTitle,
} from '@/app/components/common/section/section';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/app/components/ui/carousel';
import { getTranslations } from 'next-intl/server';
import { productService } from '@/services/product.service';
import { ProductCard } from '../../../../catalog/_components/products/product-card';

interface Props {
  handle: string;
}

export async function RecommendedProducts({ handle }: Props) {
  const t = await getTranslations('categories-products.products');
  const recommendedProducts = await productService.getRecommended(handle);

  if (!recommendedProducts.length) {
    return null;
  }

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>{t('recommended')}</SectionTitle>
      </SectionHeader>
      <section className='px-12'>
        <Carousel>
          <CarouselContent>
            {recommendedProducts?.map((product) => (
              <CarouselItem
                key={product.id}
                className='basis-1/2 lg:basis-1/3 xl:basis-1/4'
              >
                <ProductCard product={product} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </section>
    </Section>
  );
}

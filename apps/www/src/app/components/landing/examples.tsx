import { ProductCard } from '@/app/(app)/[locale]/[countryCode]/(public)/catalog/_components/products/product-card';
import { productService } from '@/services/product.service';
import { getTranslations } from 'next-intl/server';
import {
  Section,
  SectionHeader,
  SectionSubtitle,
  SectionTitle,
} from '../common/section/section';

export async function Examples() {
  const products = await productService.getExclusives();
  const i18n = await getTranslations();

  return (
    <div className='py-24 sm:py-32'>
      <Section className='max-w-desktop mx-auto w-full px-20'>
        <SectionHeader className='flex flex-col items-center justify-center'>
          <SectionTitle className='justify-center text-center text-4xl font-cinzel'>
            {i18n('landing.examples.title')}
          </SectionTitle>
          <SectionSubtitle className='text-center text-black dark:text-white'>
            {i18n('landing.examples.description')}
          </SectionSubtitle>
        </SectionHeader>
        <div className='grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-6'>
          {products.slice(0, 3).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      </Section>
    </div>
  );
}

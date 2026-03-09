import { FilterParams } from '@/lib/search-params-cache';
import { productService } from '@/services/product.service';
import { getLocale, getTranslations } from 'next-intl/server';
import { Pagination } from '../pagination';
import { ProductCardView } from './product-card-view';
import { ProductsEmpty } from './products-empty';

interface Props {
  filters: FilterParams;
}

export async function ProductsList({ filters }: Props) {
  const [data, locale, t] = await Promise.all([
    productService.getAll({ ...filters }),
    getLocale(),
    getTranslations('categories-products.products'),
  ]);

  if (data.products.length === 0) {
    return <ProductsEmpty />;
  }

  const consultLabel = t('consult');
  const productLimitedLabel = t('productLimited');

  return (
    <section
      id='catalog-products'
      className='flex flex-col gap-4 scroll-mt-24'
    >
      <ul className='grid grid-cols-[repeat(auto-fill,minmax(min(100%,140px),1fr))] gap-4 md:grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))]'>
        {data.products.map((product) => (
          <li key={product.id}>
            <ProductCardView
              product={product}
              locale={locale}
              consultLabel={consultLabel}
              productLimitedLabel={productLimitedLabel}
            />
          </li>
        ))}
      </ul>
      <Pagination info={data.info} currentPage={filters.page} />
    </section>
  );
}

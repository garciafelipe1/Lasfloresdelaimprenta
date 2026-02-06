import { MotionItem } from '@/app/components/motion/motion-item';
import { MotionList } from '@/app/components/motion/motion-list';
import { FilterParams } from '@/lib/search-params-cache';
import { productService } from '@/services/product.service';
import { Pagination } from '../pagination';
import { ProductCard } from './product-card';
import { ProductsEmpty } from './products-empty';

interface Props {
  filters: FilterParams;
}

export async function ProductsList({ filters }: Props) {
  const data = await productService.getAll({
    ...filters,
  });

  if (data.products.length === 0) {
    return <ProductsEmpty />;
  }

  return (
    <section
      id='catalog-products'
      className='flex flex-col gap-4 scroll-mt-24'
    >
      <MotionList className='grid grid-cols-[repeat(auto-fill,minmax(min(100%,140px),1fr))] gap-4 md:grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))]'>
        {data.products.map((product) => (
          <MotionItem key={product.id}>
            <ProductCard product={product} />
          </MotionItem>
        ))}
      </MotionList>
      <Pagination
        info={data.info}
        currentPage={filters.page}
      />
    </section>
  );
}

import { getRegion } from '@/lib/data/regions';
import { medusa } from '@/lib/medusa-client';
import { FilterParams } from '@/lib/search-params-cache';
import { StoreProduct, StoreProductCategory } from '@medusajs/types';
import { CATEGORIES } from '@server/constants';
import { mapProductDTO } from '@server/mappers';
import { GetProductsCustom, ProductDTO } from '@server/types';

interface ProductService {
  getAll: (opts: GetAllOpts) => Promise<GetAllResponse>;
  getOne: (id: string) => Promise<StoreProduct | null>;
  getRecommended: (id: string) => Promise<ProductDTO[]>;
  getByHandle: (handle: string) => Promise<StoreProduct>;
  getCategories: () => Promise<StoreProductCategory[]>;
  getComplements: (productId: string) => Promise<StoreProduct[]>;
  getLatests: () => Promise<StoreProduct[]>;
  getExclusives: () => Promise<ProductDTO[]>;
}

type GetAllOpts = FilterParams & {
  page: number;
};

type GetAllResponse = {
  products: ProductDTO[];
  info: {
    totalPages: number;
    totalItems: number;
  };
};

const PRODUCTS_PER_PAGE = 12;

export const productService: ProductService = {
  async getAll({ page = 1, name, category, order }) {
    const region = await getRegion('ar');

    if (!region) {
      console.error('MISSING REGION');

      return {
        products: [] as ProductDTO[],
        info: {
          totalPages: 0,
          totalItems: 0,
        },
      };
    }

    const orderOptions = order && {
      order,
    };

    const categoryOption = category && {
      category,
    };

    const qOptions = name && {
      q: name,
    };

    const queryParams = {
      page,
      ...orderOptions,
      ...categoryOption,
      ...qOptions,
      region_id: region.id,
      currency_code: region.currency_code,
    };

    const data = await medusa.client.fetch<GetProductsCustom>('/store/custom', {
      query: queryParams,
      next: {
        tags: [`products:${JSON.stringify(queryParams)}`],
      },
    });

    let totalItems = data.metadata.count;

    if ('total' in data.metadata) {
      totalItems = data.metadata.total as number;
    }

    const totalPages = Math.ceil(totalItems / PRODUCTS_PER_PAGE);

    return {
      products: data.result,
      info: {
        totalItems,
        totalPages,
      },
    };
  },
  async getOne(id: string) {
    const region = await getRegion('ar');

    if (!region) {
      return null;
    }

    const data = await medusa.store.product.retrieve(id, {
      region_id: region.id,
    });

    return data.product;
  },

  async getRecommended(handle: string) {
    // Recomienda productos con la misma categoria, si no
    // hay al menos 8 productos con esa categoria
    // busca products mas recientes agregados
    const PRODUCTS_RECOMMENDED = 8;
    const region = await getRegion('ar');

    if (!region) {
      throw new Error('No region found');
    }

    console.log('Recommending products for product:', handle);

    const product = await this.getByHandle(handle);
    const categoryId = product.categories?.[0]?.id;

    if (!categoryId) return [];

    const { products } = await medusa.store.product.list({
      region_id: region.id,
      category_id: categoryId,
      limit: PRODUCTS_RECOMMENDED + 1,
      fields: 'categories.*',
    });

    const productsSameCategory = products.filter((p) => p.id !== product.id);

    let recommended = productsSameCategory;

    if (recommended.length < PRODUCTS_RECOMMENDED) {
      const { products: recentProducts } = await medusa.store.product.list({
        region_id: region.id,
        limit: PRODUCTS_RECOMMENDED,
        order: '-created_at',
        fields: 'categories.*',
      });

      const moreProducts = recentProducts.filter(
        (p) => p.id !== product.id && !recommended.some((r) => r.id === p.id),
      );

      recommended = [
        ...recommended,
        ...moreProducts.slice(0, PRODUCTS_RECOMMENDED - recommended.length),
      ];
    }

    return recommended.map((storeProduct) => mapProductDTO(storeProduct));
  },

  async getByHandle(handle: string) {
    const region = await getRegion('ar');

    if (!region) {
      throw new Error('No region found');
    }
    const { products } = await medusa.store.product.list({
      region_id: region?.id,
      handle,
      fields: 'categories.*',
    });

    return products[0];
  },

  async getCategories() {
    const { product_categories } = await medusa.store.category.list();

    return product_categories;
  },

  async getComplements(productId: string) {
    console.log('Getting recomended complements for: ', productId);
    const categories = await this.getCategories();
    const complementoCategory = categories.find(
      (c) => c.name === CATEGORIES['complementos'],
    );

    if (!complementoCategory) {
      throw new Error('Complement category not found');
    }

    const results = await medusa.store.product.list({
      category_id: complementoCategory.id,
      limit: 2,
    });

    return results.products;
  },

  async getLatests() {
    const region = await getRegion('ar');

    if (!region) {
      throw new Error('Region is missing');
    }

    const { products } = await medusa.store.product.list({
      region_id: region.id,
      limit: 3,
      order: 'created_at',
    });

    return products;
  },

  async getExclusives() {
    const region = await getRegion('ar');

    if (!region) {
      throw new Error('No region found');
    }

    const categories = await this.getCategories();

    const { products } = await medusa.store.product.list({
      region_id: region?.id,
      fields: 'categories.*',
      limit: 3,
      category_id: categories.find(
        (c) => c.name === CATEGORIES['diseniosExclusivos'],
      )?.id,
    });

    return products.map((p) => mapProductDTO(p));
  },
};

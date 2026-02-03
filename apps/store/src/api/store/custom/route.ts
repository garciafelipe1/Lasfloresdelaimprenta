/**
 * Custom Products API Endpoint
 *
 * This endpoint provides enhanced product retrieval capabilities for the e-commerce storefront,
 * supporting advanced filtering, sorting, and pagination that goes beyond the standard Medusa
 * product endpoints.
 *
 * FEATURES:
 * - Text search by product title (case-insensitive partial matching)
 * - Category filtering by category name(s)
 * - Price-based sorting (ascending/descending) using lowest variant price
 * - Date-based sorting (created_at ascending/descending)
 * - Pagination with configurable page size
 * - Response caching for performance optimization
 * - Region-specific price calculations
 * - Automatic exclusion of "Diseños exclusivos" category when sorting by price
 *
 * QUERY PARAMETERS:
 * - q: string - Search term for product title filtering
 * - category: string[] - Array of category names to filter by
 * - order: 'price_asc' | 'price_desc' | 'created_at_asc' | 'created_at_desc' - Sort order
 * - page: number - Page number for pagination (default: 1)
 * - region_id: string - Region ID for price calculations
 * - currency_code: string - Currency code for price calculations
 *
 * RESPONSE FORMAT:
 * {
 *   result: Product[] - Array of filtered and sorted products
 *   metadata: {
 *     count: number - Number of products in current page
 *     offset: number - Current page offset
 *     limit: number - Items per page (default: 12)
 *     total: number - Total number of products matching filters
 *   }
 * }
 *
 * TECHNICAL NOTES:
 * - Uses manual processing for price sorting and category filtering due to GraphQL limitations
 * - Price sorting is based on the lowest calculated price among all product variants
 * - Category filtering supports multiple categories (OR logic)
 * - Implements server-side pagination when manual processing is required
 * - Results are cached using a stable stringified key of the query parameters
 * - Products with "Diseños exclusivos" category are excluded from price sorting
 *
 * PERFORMANCE CONSIDERATIONS:
 * - When price sorting or category filtering is used, all products are fetched first,
 *   then filtered/sorted in memory, which may impact performance with large product catalogs
 * - Caching is implemented to mitigate repeated expensive operations
 * - Database-level pagination is disabled when manual processing is required
 */

import { getLowestARSPrice } from "@/lib/get-lowest-ars-price";
import { isExclusiveProduct } from "@/lib/is-exclusive-product";
import { stableStringify } from "@/lib/stable-stringify";
import { getExpandedCategories } from "@/shared/category-mapping";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  ContainerRegistrationKeys,
  Modules,
  QueryContext,
} from "@medusajs/framework/utils";
import { GetStoreCustomSchemaType } from "./validators";

export type ProductCustom = {
  id: string;
  variants: {
    calculated_price?: {
      calculated_amount?: number;
    };
  }[];
  categories?: {
    name?: string;
  }[];
  [key: string]: any;
};

function getDateSort(order: GetStoreCustomSchemaType["order"]) {
  if (!order) {
    return {};
  }

  if (order === "price_asc" || order === "price_desc") {
    return {};
  }

  return {
    created_at: order === "created_at_desc" ? "DESC" : "ASC",
  };
}

const DEFAULT_LIMIT = 12;

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const cacheService = req.scope.resolve(Modules.CACHE);

  const params = req.validatedQuery as GetStoreCustomSchemaType;
  const disableCustomCache =
    process.env.NODE_ENV === "development" ||
    String(process.env.DISABLE_CUSTOM_CACHE ?? "false").toLowerCase() === "true";

  const filterByTitle = params.q && {
    title: {
      $ilike: `%${params.q}%`,
    },
  };

  const orderByDate = getDateSort(params.order);

  const requiresManualHandling =
    params.order === "price_asc" ||
    params.order === "price_desc" ||
    !!params.category ||
    !!params.color ||
    params.min_price !== undefined ||
    params.max_price !== undefined;

  const { data, metadata } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "description",
      "thumbnail",
      "categories.name",
      "variants.id",
      "variants.calculated_price.calculated_amount",
      "images.url",
      "metadata",
    ],
    filters: {
      ...filterByTitle,
    },
    pagination: requiresManualHandling
      ? undefined
      : {
        take: DEFAULT_LIMIT,
        skip: ((params.page ?? 1) - 1) * DEFAULT_LIMIT,
        order: orderByDate,
      },
    context: {
      variants: {
        calculated_price: QueryContext({
          region_id: params.region_id,
          currency_code: params.currency_code,
        }),
      },
    },
  });

  let result = data;

  // Filter by category name with aliases support
  if (params.category) {
    // Obtener categoría (puede ser string o array)
    const categoryName = Array.isArray(params.category)
      ? params.category[0]
      : params.category;

    // Expandir categoría con aliases (ej: "Bodas" → ["Bodas", "Follaje"])
    const expandedCategories = getExpandedCategories(categoryName);

    result = result.filter((p) =>
      p.categories?.some((c) => expandedCategories.includes(c?.name!))
    );
  }

  // Filter by color (only for "Rosas" category)
  if (params.color && params.category === "Rosas") {
    result = result.filter((p) => {
      const productColor = p.metadata?.color;
      return productColor === params.color;
    });
  }

  // Filter by price range (based on lowest variant price)
  if (params.min_price !== undefined || params.max_price !== undefined) {
    result = result.filter((p) => {
      const price = getLowestARSPrice(p as ProductCustom);
      if (params.min_price !== undefined && price < params.min_price) {
        return false;
      }
      if (params.max_price !== undefined && price > params.max_price) {
        return false;
      }
      return true;
    });
  }

  // Sort by price (excluding "Diseños exclusivos" category)
  if (params.order === "price_asc" || params.order === "price_desc") {
    // Filter out products with "Diseños exclusivos" category
    result = result.filter((p) => !isExclusiveProduct(p as ProductCustom));

    // Sort by price
    result = [...result].sort((a, b) => {
      const priceA = getLowestARSPrice(a as ProductCustom);
      const priceB = getLowestARSPrice(b as ProductCustom);
      return params.order === "price_asc" ? priceA - priceB : priceB - priceA;
    });
  }

  let manualMetadata = {
    count: 0,
    offset: 0,
    limit: 0,
    total: 0,
  };

  let finalResult = [...result];

  if (!metadata) {
    const page = (params.page ?? 1) - 1;
    finalResult = result.slice(
      page * DEFAULT_LIMIT,
      (page + 1) * DEFAULT_LIMIT
    );

    manualMetadata.count = finalResult.length;
    manualMetadata.offset = page * DEFAULT_LIMIT;
    manualMetadata.limit = DEFAULT_LIMIT;
    manualMetadata.total = result.length;
  }

  const output = { result: finalResult, metadata: metadata ?? manualMetadata };

  // Cache the response using a stable key based on query parameters
  if (!disableCustomCache) {
    const CACHE_KEY = `medusa:products:custom:${stableStringify(params)}`;
    logger.info(`Caching custom products with key: ${CACHE_KEY}`);
    cacheService.set(CACHE_KEY, { output }, 300);
  }

  res.json(output);
};

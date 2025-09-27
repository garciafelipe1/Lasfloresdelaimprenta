import { InferTypeOf } from "@medusajs/framework/types";
import Membership from "../modules/membership/models/membership";
import Subscription from "../modules/membership/models/subscription";

export type MembershipType = InferTypeOf<typeof Membership>;
export type SubscriptionType = InferTypeOf<typeof Subscription>;

// Estos tipos se usan en el endpoint /store/custom
export interface GetProductsCustom {
  result: ProductDTO[];
  metadata: Metadata;
}

export interface Metadata {
  skip: number;
  take: number;
  count: number;
}

export interface ProductDTO {
  id: string;
  title: string;
  handle: string;
  description: string;
  thumbnail: string;
  categories: Category[];
  variants: Variant[];
  images: { url: string }[];
}

export interface Category {
  id: string;
  name: string;
}

export interface Variant {
  id: string;
  calculated_price: {
    calculated_amount: number;
  };
}

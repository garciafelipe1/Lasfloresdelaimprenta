'use client';

import { addToCartAction } from '@/app/actions/cart/add-to-cart.action';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { useCartQueryParam } from '@/app/hooks/use-cart-query-param';
import { sortProductOptionValues } from '@/lib/sort-options-values';
import { StoreProduct, StoreProductVariant } from '@medusajs/types';
import { CATEGORIES } from '@server/constants';
import { isEqual } from 'lodash';
import { ArrowRight } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { formatARS } from 'utils';
import { QuantitySelector } from './QuantitySelector';
import { ProductOptions } from './product/product-options';

interface Props {
  product: StoreProduct;
}

const optionsAsKeymap = (variantOptions: StoreProductVariant['options']) => {
  return variantOptions?.reduce(
    (acc: Record<string, string>, varopt: unknown) => {
      // @ts-expect-error Medusa type
      acc[varopt.option_id] = varopt.value;
      return acc;
    },
    {},
  );
};

export function InteractiveSection({ product }: Props) {
  const [quantity, setQuantity] = useState<number>(1);
  const [options, setOptions] = useState<Record<string, string | undefined>>(
    {},
  );
  const { setOpenCart } = useCartQueryParam();
  const { execute, isExecuting } = useAction(addToCartAction, {
    onError() {
      toast.error('Hubo un error al agregar el producto al carrito');
    },
    onSuccess() {
      setOpenCart(true);
    },
  });

  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options);
      setOptions(variantOptions ?? {});
    }
  }, [product.variants]);

  // Set first options to get price
  useEffect(() => {
    if (!product.options) return;

    const defaults = product.options.reduce<Record<string, string>>(
      (acc, opt) => {
        const sortedValues = sortProductOptionValues(opt);
        if (sortedValues && sortedValues.length > 0) {
          acc[opt.id] = sortedValues[0].value;
        }
        return acc;
      },
      {},
    );

    setOptions(defaults);
  }, [product.options]);

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return;
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options);
      return isEqual(variantOptions, options);
    });
  }, [product.variants, options]);

  const handleIncrement = () => {
    setQuantity((prevQuantity) => prevQuantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prevQuantity) => prevQuantity - 1);
    }
  };

  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }));
  };

  const handleAddToCart = () => {
    if (!selectedVariant?.id) {
      toast.error('Por favor, selecciona una variante del producto.');
      return;
    }
    execute({
      variantId: selectedVariant.id,
      quantity: quantity,
    });
  };

  return (
    <div className='flex flex-col gap-4'>
      <p className='text-xl'>
        {formatARS(selectedVariant?.calculated_price?.calculated_amount ?? 0)}
      </p>
      <ul className='flex flex-col gap-2'>
        {product.options?.map((option) => (
          <ProductOptions
            isRose={
              option.title === 'Cantidad' &&
              product.categories?.some((d) => d.name === CATEGORIES['rosas'])
            }
            updateOption={setOptionValue}
            current={options[option.id]}
            option={option}
            key={option.id}
          />
        ))}
      </ul>
      <QuantitySelector
        onDecrease={handleDecrement}
        onIncrease={handleIncrement}
        quantity={quantity}
      />
      <footer className='flex flex-col gap-2'>
        <Button
          onClick={handleAddToCart}
          disabled={isExecuting || !selectedVariant?.id}
          className='group'
        >
          AÑADIR AL CARRITO
          <ArrowRight className='transition group-hover:translate-x-1' />
        </Button>
        <Badge
          variant='secondary'
          className='mx-auto text-center'
        >
          Hasta 12 cuotas sin interés en bancos seleccionados
        </Badge>
      </footer>
    </div>
  );
}

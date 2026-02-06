'use client';

import { addToCartAction } from '@/app/actions/cart/add-to-cart.action';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Checkbox } from '@/app/components/ui/checkbox';
import { WhatsAppIcon } from '@/app/components/icons/whatsapp-icon';
import { useCartQueryParam } from '@/app/hooks/use-cart-query-param';
import { sortProductOptionValues } from '@/lib/sort-options-values';
import { getWhatsAppUrl } from '@/lib/whatsapp';
import { StoreProduct, StoreProductVariant } from '@medusajs/types';
import { CATEGORIES } from '@server/constants';
import { isEqual } from 'lodash';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { formatMoneyByLocale } from '@/lib/money-formatter';
import { useLocale } from 'next-intl';
import { QuantitySelector } from './QuantitySelector';
import { ProductOptions } from './product/product-options';
import { Textarea } from '@/app/components/ui/textarea';
import { Input } from '@/app/components/ui/input';

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
  const locale = useLocale();
  const t = useTranslations('categories-products.products');
  const [quantity, setQuantity] = useState<number>(1);
  const [options, setOptions] = useState<Record<string, string | undefined>>(
    {},
  );
  const [preparado, setPreparado] = useState<'Papel' | 'Arpillera' | undefined>();
  const [indicaciones, setIndicaciones] = useState<string>('');
  const [agregarDedicatoria, setAgregarDedicatoria] = useState<boolean>(false);
  const [dedicatoria, setDedicatoria] = useState<string>('');
  const { setOpenCart } = useCartQueryParam();
  const { execute, isExecuting } = useAction(addToCartAction, {
    onError() {
      toast.error(t('addToCartError'));
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

  // Reset custom fields when product changes
  useEffect(() => {
    setPreparado(undefined);
    setIndicaciones('');
    setAgregarDedicatoria(false);
    setDedicatoria('');
  }, [product.id]);

  const isCatalogLockedCategory = useMemo(() => {
    const names = (product.categories ?? []).map((c) => c.name);
    return (
      names.includes(CATEGORIES['rosas']) ||
      names.includes(CATEGORIES['sanValentin'])
    );
  }, [product.categories]);

  const isExclusive = useMemo(() => {
    const metadata = product.metadata as unknown;
    if (!metadata || typeof metadata !== 'object') return false;
    return Boolean((metadata as Record<string, unknown>).exclusive);
  }, [product.metadata]);

  const shouldShowCustomization = useMemo(() => {
    const names = (product.categories ?? []).map((c) => c.name);
    return (
      names.includes(CATEGORIES['rosas']) ||
      names.includes(CATEGORIES['sanValentin']) ||
      names.includes(CATEGORIES['ramosPrimaverales']) ||
      names.includes(CATEGORIES['box']) ||
      names.includes(CATEGORIES['diseniosExclusivos'])
    );
  }, [product.categories]);

  // Botón de WhatsApp (compra alternativa) solo para categorías específicas
  const shouldShowWhatsAppPurchase = useMemo(() => {
    const names = (product.categories ?? []).map((c) => c.name);
    if (!names.length) return false;

    // Mostrar en TODO el catálogo, excepto complementos
    const isExcluded =
      names.includes(CATEGORIES['complementos']) ||
      names.includes(CATEGORIES['complementosSanValentin']);

    return !isExcluded;
  }, [product.categories]);

  const isPreparadoMissing = shouldShowCustomization && !preparado;

  const shouldRequireExplicitSelection = useMemo(() => {
    if (!isCatalogLockedCategory) return false;
    if (isExclusive) return false;
    // Si hay 2+ valores en alguna opción, no autoseleccionar.
    return (product.options ?? []).some((opt) => (opt.values?.length ?? 0) > 1);
  }, [isCatalogLockedCategory, isExclusive, product.options]);

  // Set first options to get price (except Rosas/San Valentín: requerir selección explícita)
  useEffect(() => {
    if (!product.options) return;

    if (shouldRequireExplicitSelection) {
      setOptions({});
      return;
    }

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
  }, [product.options, shouldRequireExplicitSelection]);

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return;
    }

    if (product.variants.length === 1) {
      return product.variants[0];
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options);
      return isEqual(variantOptions, options);
    });
  }, [product.variants, options]);

  const lowestPrice = useMemo(() => {
    const variants = product.variants ?? [];
    if (!variants.length) return 0;
    return variants.reduce((min, v) => {
      const amount =
        v.calculated_price?.calculated_amount ?? Number.POSITIVE_INFINITY;
      return Math.min(min, amount);
    }, Number.POSITIVE_INFINITY);
  }, [product.variants]);

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
      toast.error(t('selectVariant'));
      return;
    }
    if (isPreparadoMissing) {
      toast.error(t('selectPreparado'));
      return;
    }

    const metadata = shouldShowCustomization
      ? {
        preparado,
        indicaciones: indicaciones?.trim() || undefined,
        dedicatoria: agregarDedicatoria ? dedicatoria.trim() || undefined : undefined,
      }
      : undefined;

    execute({
      variantId: selectedVariant.id,
      quantity: quantity,
      ...(metadata ? { metadata } : {}),
    });
  };

  const whatsAppHref = useMemo(() => {
    if (!shouldShowWhatsAppPurchase) return '';

    const base = 'Hola, quiero reservar este producto del catálogo.';

    const optionText = (() => {
      // Preferir la variante elegida (si existe)
      if (selectedVariant?.title && product.variants && product.variants.length > 1) {
        // Usualmente: "Producto / Opción"
        const parts = selectedVariant.title.split(' / ');
        const suffix = parts.length > 1 ? parts.slice(1).join(' / ').trim() : '';
        if (suffix) return suffix;
      }

      // Si hay selección de opciones, tomar la primera que tenga valor
      for (const opt of product.options ?? []) {
        const v = options[opt.id];
        if (typeof v === 'string' && v.trim().length) {
          return `${opt.title}: ${v.trim()}`;
        }
      }

      return '';
    })();

    const lines = [
      base,
      '',
      product.title ? `Producto: ${product.title}` : '',
      optionText ? `Opción: ${optionText}` : '',
    ].filter(Boolean);

    return getWhatsAppUrl({ text: lines.join('\n') });
  }, [options, product.options, product.title, product.variants, selectedVariant?.title, shouldShowWhatsAppPurchase]);

  return (
    <div className='flex flex-col gap-4'>
      <p className='text-xl'>
        {selectedVariant?.calculated_price?.calculated_amount != null
          ? formatMoneyByLocale(
            selectedVariant.calculated_price.calculated_amount,
            locale,
          )
          : formatMoneyByLocale(lowestPrice, locale)}
      </p>
      {/* Opciones (tallas/cantidad) + WhatsApp al lado */}
      {!isExclusive ? (
        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4'>
          <ul className='flex flex-col gap-2 flex-1'>
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

          {shouldShowWhatsAppPurchase && whatsAppHref ? (
            <div className='sm:w-[260px]'>
              <Button
                asChild
                size='lg'
                className='w-full rounded-full shadow-lg bg-[#25D366] hover:bg-[#1ebe5d] text-white border border-transparent gap-2'
              >
                <Link
                  href={whatsAppHref}
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label={`Reservar ${product.title} por WhatsApp`}
                >
                  <WhatsAppIcon className='h-5 w-5' />
                  <span>Reservar por WhatsApp</span>
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
      ) : shouldShowWhatsAppPurchase && whatsAppHref ? (
        // Si es exclusivo y no hay selector de opciones, igual mostrar WhatsApp en la sección de compra
        <div>
          <Button
            asChild
            size='lg'
            className='w-full rounded-full shadow-lg bg-[#25D366] hover:bg-[#1ebe5d] text-white border border-transparent gap-2'
          >
            <Link
              href={whatsAppHref}
              target='_blank'
              rel='noopener noreferrer'
              aria-label={`Reservar ${product.title} por WhatsApp`}
            >
              <WhatsAppIcon className='h-5 w-5' />
              <span>Reservar por WhatsApp</span>
            </Link>
          </Button>
        </div>
      ) : null}

      {shouldShowCustomization ? (
        <div className='flex flex-col gap-3'>
          <div className='flex flex-col gap-y-3'>
            <Badge>{t('customization.preparadoLabel')}</Badge>
            <div className='flex flex-wrap gap-2 *:flex-1'>
              <Button
                type='button'
                variant={preparado === 'Papel' ? 'default' : 'outline'}
                onClick={() => setPreparado('Papel')}
                aria-pressed={preparado === 'Papel'}
              >
                {t('customization.preparadoOptions.papel')}
              </Button>
              <Button
                type='button'
                variant={preparado === 'Arpillera' ? 'default' : 'outline'}
                onClick={() => setPreparado('Arpillera')}
                aria-pressed={preparado === 'Arpillera'}
              >
                {t('customization.preparadoOptions.arpillera')}
              </Button>
            </div>
          </div>

          <div className='flex flex-col gap-y-2'>
            <Badge>{t('customization.indicacionesLabel')}</Badge>
            <Textarea
              value={indicaciones}
              onChange={(e) => setIndicaciones(e.target.value)}
              placeholder={t('customization.indicacionesPlaceholder')}
              maxLength={400}
            />
          </div>

          <label className='flex items-center gap-2 text-sm text-primary'>
            <Checkbox
              checked={agregarDedicatoria}
              onCheckedChange={(checked) => setAgregarDedicatoria(Boolean(checked))}
            />
            {t('customization.addDedicatoria')}
          </label>

          {agregarDedicatoria ? (
            <div className='flex flex-col gap-y-2'>
              <Badge>{t('customization.dedicatoriaLabel')}</Badge>
              <Input
                value={dedicatoria}
                onChange={(e) => setDedicatoria(e.target.value)}
                placeholder={t('customization.dedicatoriaPlaceholder')}
                maxLength={200}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <QuantitySelector
        onDecrease={handleDecrement}
        onIncrease={handleIncrement}
        quantity={quantity}
      />
      <footer className='flex flex-col gap-2'>
        <Button
          onClick={handleAddToCart}
          disabled={isExecuting || !selectedVariant?.id || isPreparadoMissing}
          className='group'
        >
          {t('addToCart')}
          <ArrowRight className='transition group-hover:translate-x-1' />
        </Button>
      </footer>
    </div>
  );
}

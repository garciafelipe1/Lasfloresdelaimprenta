'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion';
import { Button } from '@/app/components/ui/button';
import { Checkbox } from '@/app/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/app/components/ui/form';
import { FormButton } from '@/app/components/ui/form-button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { useFilterParams } from '@/app/hooks/use-filter-params';
import { zodResolver } from '@hookform/resolvers/zod';
import { CATEGORIES, sortOptions } from '@server/constants';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiltersFormSchema, filtersFormSchema } from '../form-schema';

interface FilterOption {
  label: string;
  value: string;
}

interface ColorOption extends FilterOption {
  hex: string;
  border?: boolean;
}

function scrollToCatalogResults() {
  // Scroll suave al listado de productos (sin depender de refs)
  // Nota: en mobile también ayuda a “llevar” al usuario al contenido.
  setTimeout(() => {
    const el = document.getElementById('catalog-products');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 0);
}

interface Props {
  onAutoAppliedCategory?: () => void;
}

export function Filters({ onAutoAppliedCategory }: Props) {
  const t = useTranslations('categories-products.filters');

  const CATEGORY_KEYS_ORDER = [
    'sanValentin',
    'complementosSanValentin',
    'rosas',
    'box',
    'diseniosExclusivos',
    'ramosPrimaverales',
    'complementos',
  ] as const;

  const orderedCategories = [
    ...CATEGORY_KEYS_ORDER.filter((k) => k in CATEGORIES).map((k) => [
      k,
      CATEGORIES[k],
    ]),
    ...Object.entries(CATEGORIES).filter(
      ([key]) => !CATEGORY_KEYS_ORDER.includes(key as (typeof CATEGORY_KEYS_ORDER)[number]),
    ),
  ] as Array<[string, string]>;

  const {
    filters: { name, order, category, size, color, min_price, max_price },
    isPending,
    cleanFilters,
    setCategory,
    setName,
    setOrder,
    setColor,
    setSize,
    setMinPrice,
    setMaxPrice,
  } = useFilterParams();

  const form = useForm<FiltersFormSchema>({
    resolver: zodResolver(filtersFormSchema),
    defaultValues: {
      order,
      name,
      category,
      size,
      color,
      min_price,
      max_price,
    },
  });

  const standardSizes: FilterOption[] = [
    { label: t('dynamicFilters.sizeOptions.s'), value: 'S' },
    { label: t('dynamicFilters.sizeOptions.l'), value: 'L' },
    { label: t('dynamicFilters.sizeOptions.xxl'), value: 'XXL' },
  ];

  // Colores para rosas (solo estos cuando la categoría es "Rosas")
  const rosaColors: ColorOption[] = [
    { label: t('colorsAccordion.options.red'), value: 'Rojo', hex: '#EF4444' },
    {
      label: t('colorsAccordion.options.orange'),
      value: 'Naranja',
      hex: '#F97316',
    },
    {
      label: t('colorsAccordion.options.yellow'),
      value: 'Amarillo',
      hex: '#FACC15',
    },
    {
      label: t('colorsAccordion.options.white'),
      value: 'Blanco',
      hex: '#FFFFFF',
      border: true,
    },
    { label: t('colorsAccordion.options.pink'), value: 'Rosa', hex: '#EC4899' },
  ];

  // Todos los colores (para otras categorías si es necesario)
  const allColors: ColorOption[] = [
    { label: t('colorsAccordion.options.red'), value: 'Rojo', hex: '#EF4444' },
    { label: t('colorsAccordion.options.blue'), value: 'Azul', hex: '#3B82F6' },
    {
      label: t('colorsAccordion.options.green'),
      value: 'Verde',
      hex: '#22C55E',
    },
    {
      label: t('colorsAccordion.options.yellow'),
      value: 'Amarillo',
      hex: '#FACC15',
    },
    {
      label: t('colorsAccordion.options.white'),
      value: 'Blanco',
      hex: '#FFFFFF',
      border: true,
    },
    {
      label: t('colorsAccordion.options.black'),
      value: 'Negro',
      hex: '#000000',
    },
    {
      label: t('colorsAccordion.options.orange'),
      value: 'Naranja',
      hex: '#F97316',
    },
    {
      label: t('colorsAccordion.options.purple'),
      value: 'Morado',
      hex: '#A855F7',
    },
    { label: t('colorsAccordion.options.pink'), value: 'Rosa', hex: '#EC4899' },
    { label: t('colorsAccordion.options.gray'), value: 'Gris', hex: '#6B7280' },
  ];

  // Usar colores de rosas solo cuando la categoría es "Rosas"
  const colors = category === 'Rosas' ? rosaColors : allColors;

  const handleSubmit = (data: FiltersFormSchema) => {
    setCategory(data.category);
    setName(data.name!);
    setOrder(data.order!);
    setSize(data.size);
    setMinPrice(data.min_price ?? '');
    setMaxPrice(data.max_price ?? '');
    // Solo aplicar color si la categoría es "Rosas"
    if (data.category === 'Rosas' && data.color) {
      setColor(data.color);
    } else {
      setColor('');
    }
  };

  const handleCategorySelect = (nextCategory?: string) => {
    // Aplicar categoría inmediatamente (sin “Aplicar filtro”)
    setCategory(nextCategory);
    scrollToCatalogResults();
    onAutoAppliedCategory?.();
  };

  const handleClearFilters = () => {
    form.reset();
    cleanFilters();
  };

  // Limpiar color cuando se cambia de categoría (si no es "Rosas")
  useEffect(() => {
    const currentCategory = category;
    if (currentCategory !== 'Rosas' && color) {
      setColor('');
      form.setValue('color', '');
    }
  }, [category, color, setColor, form]);

  return (
    <aside className='relative'>
      <div className='sticky top-[calc(3rem+64px)] max-h-[calc(100vh-3rem-64px)] overflow-y-auto px-4 pb-40'>
        <div className='flex flex-col gap-4'>
          <header className='flex items-center justify-between'>
            <p className='text-lg font-semibold'>{t('header')}</p>
            <Button
              variant='link'
              className='p-0 text-black hover:text-black/80 dark:text-white dark:hover:text-white/80'
              onClick={handleClearFilters}
            >
              {t('clearFiltersButton')}
            </Button>
          </header>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className='mb-4 flex flex-col gap-4'
            >
              {/* Categorías: siempre visibles y arriba */}
              <section className='flex flex-col gap-3'>
                <p className='text-base font-medium'>
                  {t('categoriesAccordion.trigger')}
                </p>
                <ul>
                  {orderedCategories.map(([key, categoryName]) => (
                    <FormField
                      key={categoryName}
                      control={form.control}
                      name='category'
                      render={({ field }) => (
                        <FormItem
                          key={categoryName}
                          className='flex flex-row items-center gap-2'
                        >
                          <FormLabel
                            className='data-[active=true]:bg-secondary hover:bg-muted w-full rounded-md p-2 text-sm font-normal capitalize'
                            data-active={field.value === categoryName}
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value === categoryName}
                                onCheckedChange={(checked) => {
                                  const next = checked ? categoryName : undefined;
                                  field.onChange(next);
                                  handleCategorySelect(next);
                                }}
                              />
                            </FormControl>
                            {/* @ts-expect-error - dynamic translation key */}
                            {t(`categoriesAccordion.options.${key}`)}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </ul>
              </section>

              {/* Filtros (mantener lógica existente) */}
              <Accordion
                type='multiple'
                className='w-full border-b'
                defaultValue={['price']}
              >
                <AccordionItem value='price'>
                  <AccordionTrigger className='py-4 text-base font-medium'>
                    {t('form.priceLabel')}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className='grid grid-cols-2 gap-3'>
                      <FormField
                        name='min_price'
                        control={form.control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('form.priceMinLabel')}</FormLabel>
                            <Input
                              type='number'
                              inputMode='numeric'
                              min={0}
                              placeholder='0'
                              {...field}
                              value={field.value || ''}
                            />
                          </FormItem>
                        )}
                      />
                      <FormField
                        name='max_price'
                        control={form.control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('form.priceMaxLabel')}</FormLabel>
                            <Input
                              type='number'
                              inputMode='numeric'
                              min={0}
                              placeholder='0'
                              {...field}
                              value={field.value || ''}
                            />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <FormField
                name='name'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.nameLabel')}</FormLabel>
                    <Input
                      placeholder={t('form.namePlaceholder')}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormItem>
                )}
              />

              <FormField
                name='order'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.orderByLabel')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value ?? undefined}
                    >
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue
                            placeholder={t('form.orderByPlaceholder')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sortOptions.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                          >
                            {t(`form.orderByOptions.${option.value}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {/* Mostrar filtro de colores solo para categoría "Rosas" */}
              {form.watch('category') === 'Rosas' ? (
                <Accordion
                  type='multiple'
                  className='w-full border-b'
                  defaultValue={['colors']}
                >
                  <AccordionItem value='colors'>
                    <AccordionTrigger className='py-4 text-base font-medium'>
                      {t('colorsAccordion.trigger')}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className='grid grid-cols-5 gap-2 p-2'>
                        {colors.map((color) => (
                          <FormField
                            key={color.value}
                            control={form.control}
                            name='color'
                            render={({ field }) => {
                              const selected = field.value === color.value;
                              return (
                                <FormItem className='relative'>
                                  <Label
                                    data-selected={selected ? '' : null}
                                    title={color.label}
                                    className={`h-8 w-8 cursor-pointer rounded-full transition hover:opacity-50 data-selected:bg-red-200 data-selected:ring-2 data-selected:ring-gray-700 data-selected:ring-offset-2 ${color.border ? 'border' : ''
                                      }`}
                                    style={{ backgroundColor: color.hex }}
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={selected}
                                        onCheckedChange={(checked) => {
                                          field.onChange(
                                            checked ? color.value : null,
                                          );
                                        }}
                                        className='peer sr-only'
                                      />
                                    </FormControl>
                                  </Label>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ) : null}

              {/* Filtro de tamaño (al final) */}
              {form.watch('category')?.length ? (
                <Accordion
                  type='multiple'
                  className='w-full border-b'
                  defaultValue={['sizes']}
                >
                  <AccordionItem value='sizes'>
                    <AccordionTrigger className='py-4 text-base font-medium'>
                      {t('dynamicFilters.sizeLabel')}
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul>
                        {standardSizes.map((sizeOption) => (
                          <FormField
                            key={sizeOption.value}
                            control={form.control}
                            name='size'
                            render={({ field }) => (
                              <FormItem
                                key={sizeOption.value}
                                className='flex flex-row items-center gap-2'
                              >
                                <FormLabel
                                  className='data-[active=true]:bg-secondary hover:bg-muted w-full rounded-md p-2 text-sm font-normal capitalize'
                                  data-active={
                                    field.value === sizeOption.value
                                      ? ''
                                      : null
                                  }
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value === sizeOption.value}
                                      onCheckedChange={(checked) => {
                                        field.onChange(
                                          checked ? sizeOption.value : undefined,
                                        );
                                      }}
                                    />
                                  </FormControl>
                                  {sizeOption.label}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ) : null}

              <FormButton
                isLoading={isPending}
                disabled={isPending}
              >
                {t('form.applyButton')}
              </FormButton>
            </form>
          </Form>
        </div>
      </div>
    </aside>
  );
}

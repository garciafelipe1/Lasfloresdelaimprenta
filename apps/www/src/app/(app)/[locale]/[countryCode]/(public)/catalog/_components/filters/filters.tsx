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

export function Filters() {
  const t = useTranslations('filters');

  const {
    filters: { name, order, category, size, color },
    isPending,
    cleanFilters,
    setCategory,
    setName,
    setOrder,
  } = useFilterParams();

  const form = useForm<FiltersFormSchema>({
    resolver: zodResolver(filtersFormSchema),
    defaultValues: {
      order,
      name,
      category,
      size,
      color,
    },
  });

  const standardSizes: FilterOption[] = [
    { label: t('dynamicFilters.sizeOptions.s'), value: 'S' },
    { label: t('dynamicFilters.sizeOptions.l'), value: 'L' },
    { label: t('dynamicFilters.sizeOptions.xxl'), value: 'XXL' },
  ];

  const colors: ColorOption[] = [
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

  const handleSubmit = (data: FiltersFormSchema) => {
    setCategory(data.category!);
    setName(data.name!);
    setOrder(data.order!);
  };

  const handleClearFilters = () => {
    form.reset();
    cleanFilters();
  };

  return (
    <aside className='relative'>
      <div className='sticky top-[calc(3rem+64px)] max-h-[calc(100vh-3rem-64px)] overflow-y-auto px-4 pb-40'>
        <div className='flex flex-col gap-4'>
          <header className='flex items-center justify-between'>
            <p className='text-lg font-semibold'>{t('header')}</p>
            <Button
              variant='link'
              className='p-0 text-gray-600 hover:text-gray-900'
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
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <Accordion
                type='multiple'
                className='w-full border-b'
                defaultValue={['categories']}
              >
                <AccordionItem value='categories'>
                  <AccordionTrigger className='py-4 text-base font-medium'>
                    {t('categoriesAccordion.trigger')}
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul>
                      {Object.values(CATEGORIES).map((category) => (
                        <FormField
                          key={category}
                          control={form.control}
                          name='category'
                          render={({ field }) => (
                            <FormItem
                              key={category}
                              className='flex flex-row items-center gap-2'
                            >
                              <FormLabel
                                className='data-[active=true]:bg-secondary hover:bg-muted w-full rounded-md p-2 text-sm font-normal capitalize'
                                data-active={field.value === category}
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value === category}
                                    onCheckedChange={(checked) => {
                                      field.onChange(
                                        checked ? category : undefined,
                                      );
                                    }}
                                  />
                                </FormControl>
                                {category}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                {form.watch('category')?.length ? (
                  <AccordionItem value='sizes'>
                    <AccordionTrigger className='py-4 text-base font-medium'>
                      {t('dynamicFilters.sizeLabel')}
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul>
                        {standardSizes.map((size) => (
                          <FormField
                            key={size.value}
                            control={form.control}
                            name='size'
                            render={({ field }) => (
                              <FormItem
                                key={size.value}
                                className='flex flex-row items-center gap-2'
                              >
                                <FormLabel
                                  className='data-[active=true]:bg-secondary hover:bg-muted w-full rounded-md p-2 text-sm font-normal capitalize'
                                  data-active={
                                    field.value === size.value ? '' : null
                                  }
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value === size.value}
                                      onCheckedChange={(checked) => {
                                        field.onChange(
                                          checked ? size.value : undefined,
                                        );
                                      }}
                                    />
                                  </FormControl>
                                  {size.label}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ) : null}
                {form.watch('category')?.length &&
                Object.values(CATEGORIES).find(
                  (c) => c === form.watch('category'),
                )! !== 'Velas' &&
                Object.values(CATEGORIES).find(
                  (c) => c === form.watch('category'),
                )! !== 'Fragancias' ? (
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
                                    className={`h-8 w-8 cursor-pointer rounded-full transition hover:opacity-50 data-selected:bg-red-200 data-selected:ring-2 data-selected:ring-gray-700 data-selected:ring-offset-2 ${
                                      color.border ? 'border' : ''
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
                ) : null}
              </Accordion>
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

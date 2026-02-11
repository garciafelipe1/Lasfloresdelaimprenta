import { Button } from '@/app/components/ui/button';
import { sortProductOptionValues } from '@/lib/sort-options-values';
import { StoreProductOption } from '@medusajs/types';
import { useTranslations } from 'next-intl';

type Props = {
  option: StoreProductOption;
  current: string | undefined;
  updateOption: (title: string, value: string) => void;
  isRose?: boolean;
};

export function ProductOptions({
  current,
  option,
  updateOption,
  isRose = false,
}: Props) {
  const t = useTranslations('categories-products.products');
  const sortedOptions = sortProductOptionValues(option) ?? [];

  return (
    <div className='flex flex-col gap-3'>
      <p className='text-sm font-medium text-muted-foreground'>
        {t('chooseOption')} · {option.title}
      </p>
      <div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
        {sortedOptions?.map(({ value }) => (
          <Button
            type='button'
            variant={value === current ? 'default' : 'outline'}
            onClick={() => updateOption(option.id, value)}
            key={value}
            className='min-h-10 text-sm font-medium'
          >
            {value}
          </Button>
        ))}
        {isRose && (
          <Button type='button' variant='outline' className='min-h-10 text-sm font-medium' onClick={() => { }}>
            Personalizado
          </Button>
        )}
      </div>
    </div>
  );
}

import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { sortProductOptionValues } from '@/lib/sort-options-values';
import { StoreProductOption } from '@medusajs/types';

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
  const sortedOptions = sortProductOptionValues(option) ?? [];

  return (
    <div className='flex flex-col gap-y-3'>
      <Badge>{option.title}</Badge>
      <div className='flex flex-wrap justify-between gap-2 *:flex-1'>
        {sortedOptions?.map(({ value }) => (
          <Button
            variant={value === current ? 'default' : 'outline'}
            onClick={() => updateOption(option.id, value)}
            key={value}
          >
            {value}
          </Button>
        ))}
        {isRose && (
          <Button
            variant='outline'
            onClick={() => {}}
          >
            Personalizado
          </Button>
        )}
      </div>
    </div>
  );
}

import { Minus, Plus } from 'lucide-react';

interface Props {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
}

export const QuantitySelector = ({
  onDecrease,
  onIncrease,
  quantity,
}: Props) => {
  return (
    <div className='inline-flex items-center overflow-hidden rounded-lg border border-input bg-muted/50'>
      <button
        type='button'
        className='text-foreground hover:bg-muted flex h-10 w-10 items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
        onClick={onDecrease}
        aria-label='Disminuir cantidad'
      >
        <Minus className='size-4' />
      </button>
      <div className='text-foreground flex min-w-[2.5rem] justify-center px-2 text-sm font-medium tabular-nums'>
        {quantity}
      </div>
      <button
        type='button'
        className='text-foreground hover:bg-muted flex h-10 w-10 items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
        onClick={onIncrease}
        aria-label='Aumentar cantidad'
      >
        <Plus className='size-4' />
      </button>
    </div>
  );
};

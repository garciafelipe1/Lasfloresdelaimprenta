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
    <div className='bg-primary/5 inline-flex items-center rounded-md'>
      <button
        className='text-primary hover:bg-primary/30 rounded-l-md px-3 py-2 text-sm font-semibold focus:ring-1 focus:outline-none'
        onClick={onDecrease}
        style={{ borderRight: '1px  ' }}
      >
        <Minus />
      </button>
      <div className='text-primary flex-grow px-4 py-2 text-center'>
        {quantity}
      </div>{' '}
      <button
        className='text-primary hover:bg-primary/30 rounded-r-md px-3 py-2 text-sm font-semibold focus:ring-1 focus:outline-none'
        onClick={onIncrease}
        style={{ borderLeft: '1px ' }}
      >
        <Plus />
      </button>
    </div>
  );
};

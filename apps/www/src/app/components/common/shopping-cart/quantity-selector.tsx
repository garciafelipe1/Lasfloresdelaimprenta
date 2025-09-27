interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onDecrease,
  onIncrease,
}) => {
  return (
    <div>
      <div className='text-primary mb-2 text-sm uppercase'>Cantidad</div>
      <div className='flex items-center space-x-2'>
        <button
          className='border-secondary bg-secondary text-primary hover:bg-primary/30 rounded-md px-3 py-1 text-sm focus:outline-none'
          onClick={onDecrease}
        >
          -
        </button>
        <div>{quantity}</div>
        <button
          className='border-secondary bg-secondary text-primary hover:bg-primary/30 rounded-md px-3 py-1 text-sm focus:outline-none'
          onClick={onIncrease}
        >
          +
        </button>
      </div>
    </div>
  );
};

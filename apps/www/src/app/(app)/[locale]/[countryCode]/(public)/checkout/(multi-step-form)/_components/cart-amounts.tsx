import { formatARS } from 'utils';

interface Props {
  itemsTotal: number;
  shippingTotal: number;
  total: number;
}

export function CartAmounts({ itemsTotal, shippingTotal, total }: Props) {
  return (
    <section className='flex flex-col divide-y *:py-2'>
      <div className='flex items-center justify-between font-light'>
        <p className='m-0'>Subtotal</p>
        <p className='m-0'>{formatARS(itemsTotal)}</p>
      </div>
      <div className='flex items-center justify-between font-light'>
        <p className='m-0'>Envío</p>
        <p className='m-0'>{formatARS(shippingTotal)}</p>
      </div>
      <div className='flex items-center justify-between font-semibold'>
        <p className='m-0'>Total</p>
        <p className='m-0'>{formatARS(total)}</p>
      </div>
    </section>
  );
}

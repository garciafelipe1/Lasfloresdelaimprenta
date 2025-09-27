import { StoreCart } from '@medusajs/types';
import Image from 'next/image';
import { formatARS } from 'utils';
import { CartAmounts } from '../../_components/cart-amounts';

interface Props {
  cart: StoreCart;
}

export function SummaryInfo({ cart }: Props) {
  const { last_name, first_name, city, province, phone, address_1 } =
    cart.shipping_address!;

  const { amount, name } = cart.shipping_methods![0]!;

  return (
    <div className='flex flex-col divide-y *:py-4 **:m-0'>
      <div className='flex flex-col gap-2'>
        <h4>Envío</h4>
        <p>
          {first_name} {last_name}
        </p>
        <p className='opacity-50'>
          {province} - {city} - {address_1}
        </p>
      </div>
      <div className='flex flex-col gap-2'>
        <h4>Productos en tu pedido</h4>
        <ul className='grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-4'>
          {cart.items?.map((item) => (
            <div
              key={item.id}
              className='bg-secondary flex gap-4 rounded-md p-2 shadow'
            >
              <div className='relative aspect-square h-20 w-20'>
                <Image
                  alt=''
                  src={item.thumbnail ?? ''}
                  className='h-full w-full rounded-md object-cover'
                  fill
                />
              </div>
              <div className='flex flex-col gap-1'>
                <h4>{item.title}</h4>
                <div className='flex flex-col text-sm opacity-75'>
                  <p>Precio unitario: {formatARS(item.unit_price)}</p>
                  <p>Unidades: {item.quantity}</p>
                  <p>subtotal: {formatARS(item.total)}</p>
                </div>
                {item.metadata && (
                  <p className='text-sm italic'>
                    {item.metadata.message as string}
                  </p>
                )}
              </div>
            </div>
          ))}
        </ul>
      </div>
      <div className='flex flex-col gap-2'>
        <h4>Envío</h4>
        <div>
          <span className='opacity-50'>Método:</span> {name}
        </div>
        <div>
          <span className='opacity-50'>Monto:</span> {formatARS(amount)}
        </div>
      </div>
      <div className='flex flex-col gap-2'>
        <h4>Contacto</h4>
        <div>
          <span className='opacity-50'>Email:</span> {cart.email}
        </div>
        <div>
          <span className='opacity-50'>Celular:</span> {phone}
        </div>
      </div>
      <div className='flex flex-col gap-2'>
        <h4>Resumen del pedido</h4>
        <CartAmounts
          itemsTotal={cart.item_subtotal}
          shippingTotal={cart.shipping_total}
          total={cart.total}
        />
      </div>
    </div>
  );
}

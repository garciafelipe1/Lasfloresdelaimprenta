'use client';

import {
  ItemBody,
  ItemImage,
  ItemRoot,
} from '@/app/components/common/shopping-cart/shopping-cart-item';
import { Button } from '@/app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { canHaveMessage } from '@/lib/canHaveMessage';
import { StoreCartLineItem } from '@medusajs/types';
import { useState } from 'react';
import { MessageForm } from './message-form';

interface Props {
  items: StoreCartLineItem[];
}

export function CheckoutCartItems({ items }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StoreCartLineItem | null>(
    null,
  );

  return (
    <>
      <ul className='flex flex-col gap-2'>
        {items.map((item) => (
          <ItemRoot
            className='border-none p-0'
            key={item.id}
          >
            <ItemImage
              quantity={item.quantity}
              alt={`${item.title} image`}
              src={item.thumbnail ?? ''}
            />
            <ItemBody
              price={item.unit_price}
              title={item.title}
            >
              {canHaveMessage(item.product?.categories) &&
                (item.metadata!.message ? (
                  <div className='flex items-center justify-between gap-2'>
                    <p className='text-sm italic opacity-55'>
                      &quot;{item.metadata!.message as string}&quot;
                    </p>
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setDialogOpen(true);
                      }}
                    >
                      editar
                    </button>
                  </div>
                ) : (
                  <Button
                    size='sm'
                    className='text-xs'
                    onClick={() => {
                      setSelectedItem(item);
                      setDialogOpen(true);
                    }}
                  >
                    Agregar mensaje (Opcional)
                  </Button>
                ))}
            </ItemBody>
          </ItemRoot>
        ))}
      </ul>
      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Querés agregar un mensaje a tu ramo?</DialogTitle>
            <DialogDescription className='m-0'>
              Escribí un mensaje especial que acompañe tus flores. Lo
              imprimiremos en una tarjeta y lo incluiremos con tu pedido. 🌸
            </DialogDescription>
          </DialogHeader>
          <MessageForm
            message={selectedItem?.metadata!.message as string}
            itemId={selectedItem?.id ?? ''}
            quantity={selectedItem?.quantity ?? 1}
            onClose={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

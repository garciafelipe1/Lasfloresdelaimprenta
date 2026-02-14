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
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { MessageForm } from './message-form';

interface Props {
  items: StoreCartLineItem[];
}

export function CheckoutCartItems({ items }: Props) {
  const t = useTranslations('checkout');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StoreCartLineItem | null>(
    null,
  );

  return (
    <>
      <ul className='flex flex-col gap-2 sm:gap-2'>
        {items.map((item) => (
          <ItemRoot
            className='border-none p-0 sm:p-0'
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
                (item.metadata?.message ? (
                  <div className='flex items-center justify-between gap-2'>
                    <p className='text-sm italic opacity-55'>
                      &quot;{String(item.metadata.message)}&quot;
                    </p>
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setDialogOpen(true);
                      }}
                    >
                      {t('message.edit')}
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
                    {t('message.addOptional')}
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
            <DialogTitle>{t('message.dialogTitle')}</DialogTitle>
            <DialogDescription className='m-0'>
              {t('message.dialogDescription')}
            </DialogDescription>
          </DialogHeader>
          <MessageForm
            message={
              typeof selectedItem?.metadata?.message === 'string'
                ? selectedItem.metadata.message
                : ''
            }
            itemId={selectedItem?.id ?? ''}
            quantity={selectedItem?.quantity ?? 1}
            onClose={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

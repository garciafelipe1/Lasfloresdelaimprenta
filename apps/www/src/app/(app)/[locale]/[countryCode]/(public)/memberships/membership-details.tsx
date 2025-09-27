'use client';

import { EliteIcon } from '@/app/components/icons/elite-icon';
import { EscencialIcon } from '@/app/components/icons/escencial-icon';
import { PremiumIcon } from '@/app/components/icons/premium-icon';
import { Button } from '@/app/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/app/components/ui/carousel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { StoreCustomer } from '@medusajs/types';
import { MembershipId } from '@server/constants';
import { MembershipType } from '@server/types';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ReactNode, useState } from 'react';
import { toast } from 'sonner';
import { formatARS } from 'utils';
import { MembershipForm } from './membership-form';

type MembershipDetails = {
  id: MembershipId;
  title: MembershipType['name'];
  icon: ReactNode;
  description: string;
  images?: string[];
  price: number;
};

const membershipsDetails: MembershipDetails[] = [
  {
    id: 'esencial',
    title: 'Esencial',
    description: 'asdasd',
    icon: <EscencialIcon className='size-6' />,
    price: 110000,
  },
  {
    id: 'premium',
    title: 'Premium',
    description: 'asdasd',
    images: ['asda'],
    icon: <PremiumIcon className='size-6' />,
    price: 185000,
  },
  {
    id: 'elite',
    title: 'Elite',
    description: 'asdasd',
    images: ['asda'],
    icon: <EliteIcon className='size-6' />,
    price: 285000,
  },
];

interface Props {
  user: StoreCustomer | null;
}

export function MembershipDetails({ user }: Props) {
  const router = useRouter();
  const [selectedMembership, setSelectedMembership] =
    useState<MembershipId | null>(null);
  const [open, setOpen] = useState(false);

  const handleClick = (plan: MembershipId) => {
    if (!user) {
      router.push('/login');
      toast.info('Debes iniciar sesión para elegir un plan');
      return;
    }
    setOpen(true);
    setSelectedMembership(plan);
  };

  return (
    <>
      <section className='flex w-full flex-col divide-y border-y'>
        {membershipsDetails.map((membership, index) => (
          <div
            data-odd={index % 2 === 1 ? '' : null}
            id={membership.id}
            key={membership.title}
            className='group scroll-mt-44 px-6'
          >
            <div className='max-w-desktop mx-auto flex w-full items-center gap-4 py-32 group-data-odd:flex-row-reverse'>
              <div
                className={`${membership.id} h-fit w-[300px] overflow-hidden rounded-md border`}
              >
                <div className='flex flex-col p-2'>
                  <header className='flex items-center justify-between gap-2'>
                    <span className='bg-border rounded border p-1'>
                      {membership.icon}
                    </span>
                    <p className='m-0'>{membership.title}</p>
                  </header>
                  <div>
                    <p className='m-0'>Precio por mes</p>
                    <p className='m-0 text-2xl font-semibold'>
                      {formatARS(membership.price)}
                    </p>
                  </div>
                </div>
                <footer className='bg-background border-t p-2'>
                  <Button onClick={() => handleClick(membership.id)}>
                    Obtener membresía
                  </Button>
                </footer>
              </div>
              <div className='flex-1 px-20'>
                <Carousel
                  opts={{
                    loop: true,
                  }}
                >
                  <CarouselContent className='-ml-4'>
                    {Array(5)
                      .fill(1)
                      .map((n, index) => (
                        <CarouselItem
                          key={index}
                          className='relative aspect-square pl-4 md:basis-1/2 lg:basis-1/3'
                        >
                          <Image
                            className='bg-card h-full w-full rounded-md border object-cover'
                            src='/assets/img/flor-4.jpg'
                            alt='Membership rewards'
                            fill
                          />
                        </CarouselItem>
                      ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </div>
            </div>
          </div>
        ))}
      </section>

      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Suscribirse | {selectedMembership}</DialogTitle>
            <DialogDescription>
              Necesitamos vincular tu cuenta de mercado pago con tu cuenta de
              las flores de la imprenta
            </DialogDescription>
          </DialogHeader>
          <MembershipForm membership={selectedMembership ?? 'esencial'} />
        </DialogContent>
      </Dialog>
    </>
  );
}

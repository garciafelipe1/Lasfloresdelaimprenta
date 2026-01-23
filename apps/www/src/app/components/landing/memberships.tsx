/* eslint-disable @typescript-eslint/no-explicit-any */

import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import Link from 'next/link';
import { ReactNode } from 'react';
import { EliteIcon } from '../icons/elite-icon';
import { EscencialIcon } from '../icons/escencial-icon';
import { PremiumIcon } from '../icons/premium-icon';

const tiers = [
  {
    src: '/assets/img/escencial.svg',
    titleKey: 'membership.membershipbasic.title',
    subtitleKey: 'membership.membershipbasic.subtitle',
    href: '/memberships#esencial',
    icon: <EscencialIcon />,
  },
  {
    src: '/assets/img/premium.svg',
    titleKey: 'membership.membershippremium.title',
    subtitleKey: 'membership.membershippremium.subtitle',
    href: '/memberships#premium',
    icon: <PremiumIcon />,
  },
  {
    src: '/assets/img/elite.svg',
    titleKey: 'membership.membershipbussiness.title',
    subtitleKey: 'membership.membershipbussiness.subtitle',
    href: '/memberships#elite',
    icon: <EliteIcon />,
  },
];

export async function Memberships() {
  const t = await getTranslations();

  return (
    <section className='relative bg-zinc-50 py-16 md:py-32 dark:bg-transparent overflow-hidden'>
      {/* Imagen decorativa izquierda - 3 imágenes completas para línea completa */}
      <div className='absolute left-0 top-1/2 -translate-y-1/2 w-32 md:w-48 hidden md:flex flex-col pointer-events-none h-full'>
        <Image
          src='/assets/img/floresmembresiassinfondo.png'
          alt=''
          width={100}
          height={800}
          className='w-full h-auto object-contain opacity-60'
          aria-hidden='true'
        />
        <Image
          src='/assets/img/floresmembresiassinfondo.png'
          alt=''
          width={100}
          height={800}
          className='w-full h-auto object-contain opacity-60'
          aria-hidden='true'
        />
        <Image
          src='/assets/img/floresmembresiassinfondo.png'
          alt=''
          width={200}
          height={800}
          className='w-full h-auto object-contain opacity-60'
          aria-hidden='true'
        />
      </div>

      {/* Imagen decorativa derecha - 3 imágenes completas para línea completa */}
      <div className='absolute right-0 top-1/2 -translate-y-1/2  w-32 md:w-48 hidden md:flex flex-col pointer-events-none h-full'>
        <Image
          src='/assets/img/floresmembresiassinfondo.png'
          alt=''
          width={200}
          height={800}
          className='w-full h-auto object-contain opacity-60 scale-x-[-1]'
          aria-hidden='true'
        />
        <Image
          src='/assets/img/floresmembresiassinfondo.png'
          alt=''
          width={200}
          height={800}
          className='w-full h-auto object-contain opacity-60 scale-x-[-1]'
          aria-hidden='true'
        />
        <Image
          src='/assets/img/floresmembresiassinfondo.png'
          alt=''
          width={200}
          height={800}
          className='w-full h-auto object-contain opacity-60 scale-x-[-1]'
          aria-hidden='true'
        />
      </div>

      <div className='@container mx-auto max-w-5xl px-6 relative z-10'>
        <div className='text-center'>
          <h2 className='text-4xl text-primary'>{t('landing.memberships.title')}</h2>
          <p className='text-primary'> {t('landing.memberships.description')}</p>
        </div>
        <div className='mx-auto mt-6 grid max-w-sm gap-6 *:text-center md:mt-16 @min-4xl:max-w-full @min-4xl:grid-cols-3'>
          {tiers.map((tier) => (
            <Card
              key={tier.href}
              className='group shadow-zinc-950/5'
            >
              <CardHeader className='pb-3'>
                <CardDecorator icon={tier.icon} />
                <h3 className='mt-6 text-center font-medium'>
                  {t(tier.titleKey as any)}
                </h3>
              </CardHeader>
              <CardContent className='grid h-full grid-rows-[1fr_auto]'>
                <p className='text-center text-sm'>
                  {t(tier.subtitleKey as any)}
                </p>
                <Link
                  className='group/link'
                  href={tier.href}
                >
                  <Button className='mt-4 w-full'>
                    Ver más{' '}
                    <ArrowRight className='transition group-hover/link:translate-x-1' />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const CardDecorator = ({ icon }: { icon: ReactNode }) => (
  <div className='relative mx-auto size-36'>
    <div
      aria-hidden
      className='absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] mask-radial-from-black mask-radial-to-transparent mask-radial-at-center bg-[size:24px_24px]'
    />
    <div className='bg-background absolute inset-0 m-auto flex size-12 items-center justify-center border-t border-l'>
      {icon}
    </div>
  </div>
);

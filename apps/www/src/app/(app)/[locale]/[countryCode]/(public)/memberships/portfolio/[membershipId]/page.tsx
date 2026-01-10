'use client';

import { EliteIcon } from '@/app/components/icons/elite-icon';
import { EscencialIcon } from '@/app/components/icons/escencial-icon';
import { PremiumIcon } from '@/app/components/icons/premium-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { MembershipId } from '@server/constants';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { formatARS } from 'utils';
import { membershipColors } from '../../constants';
import { MembershipForm } from '../../membership-form';

// Portfolio de imágenes por membresía
// TODO: Reemplazar estas imágenes con las imágenes reales de cada membresía
const membershipPortfolios: Record<MembershipId, string[]> = {
  esencial: [
    '/assets/img/flor-4.jpg',
    '/assets/img/hero-1.webp',
    '/assets/img/hero-2.webp',
    '/assets/img/flor-4.jpg',
    '/assets/img/hero-3.webp',
    '/assets/img/hero-4.webp',
  ],
  premium: [
    '/assets/img/flor-4.jpg',
    '/assets/img/hero-2.webp',
    '/assets/img/hero-1.webp',
    '/assets/img/flor-4.jpg',
    '/assets/img/hero-3.webp',
    '/assets/img/hero-4.webp',
  ],
  elite: [
    '/assets/img/flor-4.jpg',
    '/assets/img/hero-3.webp',
    '/assets/img/hero-4.webp',
    '/assets/img/flor-4.jpg',
    '/assets/img/hero-1.webp',
    '/assets/img/hero-2.webp',
  ],
};

const membershipNames: Record<MembershipId, string> = {
  esencial: 'Esencial',
  premium: 'Premium',
  elite: 'Elite',
};

const membershipPrices: Record<MembershipId, number> = {
  esencial: 110000,
  premium: 185000,
  elite: 285000,
};

const membershipIcons: Record<MembershipId, React.ReactNode> = {
  esencial: <EscencialIcon className='size-6' />,
  premium: <PremiumIcon className='size-6' />,
  elite: <EliteIcon className='size-6' />,
};

export default function MembershipPortfolioPage() {
  const params = useParams();
  const membershipId = params.membershipId as MembershipId;
  const locale = params.locale as string;
  const countryCode = params.countryCode as string;
  const [open, setOpen] = useState(false);

  // Validar que la membresía existe
  if (!membershipId || !membershipPortfolios[membershipId]) {
    return (
      <div className='flex min-h-screen items-center justify-center px-4'>
        <div className='text-center'>
          <h1 className='mb-4 text-2xl font-bold'>Membresía no encontrada</h1>
          <Link href={`/${locale}/${countryCode}/memberships`}>
            <Button>Volver a Membresías</Button>
          </Link>
        </div>
      </div>
    );
  }

  const images = membershipPortfolios[membershipId];
  const membershipName = membershipNames[membershipId];
  const colors = membershipColors[membershipId];
  const membershipIcon = membershipIcons[membershipId];
  const membershipPrice = membershipPrices[membershipId];

  // Scroll al formulario si hay hash en la URL
  useEffect(() => {
    if (window.location.hash === '#obtener-membresia') {
      const element = document.getElementById('obtener-membresia');
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, []);

  const handleClick = () => {
    setOpen(true);
  };

  return (
    <div className='min-h-screen bg-background'>
      <div className='mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8 flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Link href={`/${locale}/${countryCode}/memberships`}>
              <Button
                variant='ghost'
                size='icon'
                className='h-10 w-10'
              >
                <ArrowLeft className='h-5 w-5' />
              </Button>
            </Link>
            <div>
              <h1 className='text-3xl font-bold md:text-4xl'>
                Portfolio - Membresía {membershipName}
              </h1>
              <p className='mt-2 text-muted-foreground'>
                Explora todas nuestras creaciones para esta membresía
              </p>
            </div>
          </div>
          <Badge className={colors.accent}>{membershipName}</Badge>
        </div>

        {/* Carrusel de imágenes */}
        {images.length > 0 ? (
          <div className='mb-8'>
            <Carousel
              opts={{
                loop: true,
                align: 'start',
              }}
              className='w-full'
            >
              <CarouselContent className='-ml-2 md:-ml-4'>
                {images.map((imageUrl, index) => (
                  <CarouselItem
                    key={index}
                    className='pl-2 md:basis-1/2 lg:basis-1/3 md:pl-4'
                  >
                    <div className='relative aspect-square overflow-hidden rounded-lg border'>
                      <Image
                        src={imageUrl}
                        alt={`${membershipName} portfolio - Imagen ${index + 1}`}
                        fill
                        className='object-cover transition-transform duration-300 hover:scale-105'
                        sizes='(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
                        loading={index < 3 ? 'eager' : 'lazy'}
                        quality={85}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        ) : (
          <div className='mb-8 flex min-h-[400px] items-center justify-center rounded-lg border'>
            <p className='text-muted-foreground'>
              No hay imágenes disponibles para esta membresía
            </p>
          </div>
        )}

        {/* Grid de imágenes (vista completa) */}
        {images.length > 0 && (
          <div className='mb-12'>
            <h2 className='mb-6 text-2xl font-semibold'>Galería Completa</h2>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
              {images.map((imageUrl, index) => (
                <div
                  key={index}
                  className='group relative aspect-square overflow-hidden rounded-lg border transition-shadow duration-300 hover:shadow-lg'
                >
                  <Image
                    src={imageUrl}
                    alt={`${membershipName} portfolio - Imagen ${index + 1}`}
                    fill
                    className='object-cover transition-transform duration-300 group-hover:scale-110'
                    sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'
                    loading={index < 4 ? 'eager' : 'lazy'}
                    quality={80}
                  />
                  <div className='absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10' />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sección de Obtener Membresía */}
        <div
          id='obtener-membresia'
          className='scroll-mt-24'
        >
          <div className='flex w-full justify-center'>
            <div
              className={`${membershipId} h-fit w-[300px] overflow-hidden rounded-md border`}
            >
              <div className='flex flex-col p-2'>
                <header className='flex items-center justify-between gap-2'>
                  <span className='bg-border rounded border p-1'>
                    {membershipIcon}
                  </span>
                  <p className='m-0'>{membershipName}</p>
                </header>
                <div>
                  <p className='m-0'>Precio por mes</p>
                  <p className='m-0 text-2xl font-semibold'>
                    {formatARS(membershipPrice)}
                  </p>
                </div>
              </div>
              <footer className='bg-background border-t p-2'>
                <Button
                  onClick={handleClick}
                  className='w-full'
                >
                  Obtener membresía
                </Button>
              </footer>
            </div>
          </div>
        </div>

        {/* Dialog para el formulario */}
        <Dialog
          open={open}
          onOpenChange={setOpen}
        >
          <DialogContent className='sm:max-w-[425px]'>
            <DialogHeader>
              <DialogTitle>Suscribirse | {membershipName}</DialogTitle>
              <DialogDescription>
                Necesitamos vincular tu cuenta de mercado pago con tu cuenta de
                las flores de la imprenta
              </DialogDescription>
            </DialogHeader>
            <MembershipForm membership={membershipId} />
          </DialogContent>
        </Dialog>

        {/* Footer con botón de volver */}
        <div className='mt-12 flex justify-center border-t pt-8'>
          <Link href={`/${locale}/${countryCode}/memberships`}>
            <Button
              variant='outline'
              size='lg'
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              Volver a Comparación de Membresías
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

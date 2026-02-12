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
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { formatARS } from 'utils';
import { membershipColors } from '../../constants';
import { MembershipForm } from '../../membership-form';

const ELITE_PORTFOLIO_V = '20260205';

// Portfolio de imágenes por membresía
// Portfolio de ejemplo (velas) - reemplazable cuando haya fotos definitivas
const candleGallery: string[] = [
  '/assets/img/memberships/velas/vela-1.png',
  // '/assets/img/memberships/velas/vela-2.png',
  '/assets/img/memberships/velas/vela-3.png',
  // '/assets/img/memberships/velas/vela-4.png',
  '/assets/img/memberships/velas/vela-5.png',
  '/assets/img/memberships/velas/vela-6.png',
  '/assets/img/memberships/velas/vela-7.png',
];

// Ramos (3 fotos) - “héroes” para la composición premium de Esencial
const esencialBouquet: string[] = [
  '/assets/img/memberships/carousel/carousel-1.png',
  '/assets/img/memberships/carousel/carousel-2.png',
  '/assets/img/memberships/carousel/carousel-3.png',
];

const premiumGallery: string[] = [
  '/assets/img/memberships/premium/premium-7.png',
  '/assets/img/memberships/premium/premium-3.png',
  '/assets/img/memberships/premium/premium-2.png',
  '/assets/img/memberships/premium/premium-4.png',
  '/assets/img/memberships/premium/premium-5.png',
  '/assets/img/memberships/premium/premium-6.png',
  // '/assets/img/memberships/premium/premium-7.png',
];

const eliteGallery: string[] = [
  `/assets/img/memberships/elite/portfolio/elite-01.jpg?v=${ELITE_PORTFOLIO_V}`,
  `/assets/img/memberships/elite/portfolio/elite-02.jpg?v=${ELITE_PORTFOLIO_V}`,
  `/assets/img/memberships/elite/portfolio/elite-03.jpg?v=${ELITE_PORTFOLIO_V}`,
  `/assets/img/memberships/elite/portfolio/elite-04.jpg?v=${ELITE_PORTFOLIO_V}`,
  `/assets/img/memberships/elite/portfolio/elite-05.jpg?v=${ELITE_PORTFOLIO_V}`,
  `/assets/img/memberships/elite/portfolio/elite-06.jpg?v=${ELITE_PORTFOLIO_V}`,
  `/assets/img/memberships/elite/portfolio/elite-07.jpg?v=${ELITE_PORTFOLIO_V}`,
  `/assets/img/memberships/elite/portfolio/elite-08.jpg?v=${ELITE_PORTFOLIO_V}`,
  `/assets/img/memberships/elite/portfolio/elite-09.jpg?v=${ELITE_PORTFOLIO_V}`,

];

// Carrusel (3 fotos)
const membershipCarousel: Record<MembershipId, string[]> = {
  esencial: [
    '/assets/img/memberships/carousel/carousel-3.png',
    '/assets/img/memberships/velas/vela-7.png',
    '/assets/img/memberships/carousel/carousel-2.png',
  ],
  premium: [
    '/assets/img/memberships/premium/premium-1.png',
    '/assets/img/memberships/premium/premium-2.png',
    '/assets/img/memberships/premium/premium-3.png',
    '/assets/img/memberships/premium/premium-4.png',
    '/assets/img/memberships/premium/premium-5.png',
    '/assets/img/memberships/premium/premium-6.png',
    '/assets/img/memberships/premium/premium-7.png',
  ],
  elite: [
    ...eliteGallery,
  ],
};

// Galería / grilla (velas)
const membershipGallery: Record<MembershipId, string[]> = {
  esencial: candleGallery,
  premium: premiumGallery,
  elite: eliteGallery,
};

function buildEsencialGallery(opts: {
  bouquet: string[];
  candles: string[];
}): string[] {
  const bouquet = (opts.bouquet || []).filter(Boolean);
  const candles = (opts.candles || []).filter(Boolean);

  // Mosaico premium: alternar "héroes" (ramos) con detalles (velas),
  // y luego completar con el resto de velas.
  const interleaved: string[] = [];
  if (bouquet[0]) interleaved.push(bouquet[0]);
  if (candles[0]) interleaved.push(candles[0]);
  if (bouquet[1]) interleaved.push(bouquet[1]);
  if (candles[1]) interleaved.push(candles[1]);
  if (bouquet[2]) interleaved.push(bouquet[2]);

  const used = new Set(interleaved);
  const remainingCandles = candles.filter((c) => !used.has(c));
  return [...interleaved, ...remainingCandles];
}

function getEsencialTileClass(index: number): string {
  // Patrón con variación de alturas/anchos (sin forzar todo cuadrado).
  switch (index) {
    case 0:
      // Hero bouquet (portrait 4:5) ancho
      return 'col-span-2 row-span-4 md:col-span-2 md:row-span-4 lg:col-span-2 lg:row-span-4';
    case 1:
      // Detalle (vela) cuadrado
      return 'col-span-1 row-span-2 md:col-span-1 md:row-span-2 lg:col-span-1 lg:row-span-2';
    case 2:
      // Bouquet (portrait)
      return 'col-span-1 row-span-4 md:col-span-1 md:row-span-4 lg:col-span-1 lg:row-span-4';
    case 3:
      // Detalle (vela)
      return 'col-span-1 row-span-2 md:col-span-1 md:row-span-2 lg:col-span-1 lg:row-span-2';
    case 4:
      // Bouquet (portrait) ancho en mobile
      return 'col-span-2 row-span-4 md:col-span-1 md:row-span-4 lg:col-span-1 lg:row-span-4';
    default:
      // Resto detalles: cuadrados/horizontales pequeños
      return 'col-span-1 row-span-2 md:col-span-1 md:row-span-2 lg:col-span-1 lg:row-span-2';
  }
}

function getPremiumTileClass(index: number): string {
  // Premium: misma lógica de “recorrido visual”, pero con un ritmo más balanceado.
  // (Verticales 4:5 + detalles cuadrados/horizontales).
  switch (index) {
    case 0:
      // Hero bouquet (portrait) ancho
      return 'col-span-2 row-span-4 md:col-span-2 md:row-span-4 lg:col-span-2 lg:row-span-4';
    case 1:
      // Detalle cuadrado
      return 'col-span-1 row-span-2 md:col-span-1 md:row-span-2 lg:col-span-1 lg:row-span-2';
    case 2:
      // Bouquet (portrait)
      return 'col-span-1 row-span-4 md:col-span-1 md:row-span-4 lg:col-span-1 lg:row-span-4';
    case 3:
      // Horizontal pequeño para “respirar”
      return 'col-span-2 row-span-2 md:col-span-2 md:row-span-2 lg:col-span-2 lg:row-span-2';
    case 4:
      // Bouquet (portrait) secundario
      return 'col-span-1 row-span-4 md:col-span-1 md:row-span-4 lg:col-span-1 lg:row-span-4';
    default:
      return 'col-span-1 row-span-2 md:col-span-1 md:row-span-2 lg:col-span-1 lg:row-span-2';
  }
}

function getEliteTileClass(index: number): string {
  // Elite: composición más “editorial” (más respiración + héroes más presentes).
  // Mantiene verticales (4:5) como foco y piezas compactas como pausa.
  switch (index) {
    case 0:
      // Hero 1 (portrait) ancho
      return 'col-span-2 row-span-4 md:col-span-2 md:row-span-4 lg:col-span-2 lg:row-span-4';
    case 1:
      // Detalle / complemento
      return 'col-span-1 row-span-2 md:col-span-1 md:row-span-2 lg:col-span-1 lg:row-span-2';
    case 2:
      // Hero 2 (portrait)
      return 'col-span-1 row-span-4 md:col-span-1 md:row-span-4 lg:col-span-1 lg:row-span-4';
    case 3:
      // Horizontal para dar ritmo
      return 'col-span-2 row-span-2 md:col-span-2 md:row-span-2 lg:col-span-2 lg:row-span-2';
    case 4:
      // Hero 3 (portrait) ancho en mobile
      return 'col-span-2 row-span-4 md:col-span-1 md:row-span-4 lg:col-span-1 lg:row-span-4';
    default:
      return 'col-span-1 row-span-2 md:col-span-1 md:row-span-2 lg:col-span-1 lg:row-span-2';
  }
}

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
  const t = useTranslations('membership.portfolio');

  // Validar que la membresía existe
  if (!membershipId || !(membershipId in membershipNames)) {
    return (
      <div className='flex min-h-screen items-center justify-center px-4'>
        <div className='text-center'>
          <h1 className='mb-4 text-2xl font-bold'>{t('notFound.title')}</h1>
          <Link href={`/${locale}/${countryCode}/memberships`}>
            <Button>{t('notFound.backButton')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isEsencial = membershipId === 'esencial';
  const isPremium = membershipId === 'premium';
  const isElite = membershipId === 'elite';
  const isMosaic = isEsencial || isPremium || isElite;
  const carouselImages = (membershipCarousel[membershipId] ?? []).filter(Boolean);
  const galleryImages = isEsencial
    ? buildEsencialGallery({
      bouquet: esencialBouquet,
      candles: candleGallery,
    })
    : (membershipGallery[membershipId] ?? []).filter(Boolean);
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
                {t('header.title')} {membershipName}
              </h1>
              <p className='mt-2 text-muted-foreground'>
                {t('header.description')}
              </p>
            </div>
          </div>
          <Badge className={colors.accent}>{membershipName}</Badge>
        </div>

        {/* Carrusel de imágenes */}
        {carouselImages.length > 0 ? (
          <div className='mb-8'>
            <Carousel
              opts={{
                loop: true,
                align: 'start',
              }}
              className='w-full'
            >
              <CarouselContent className='-ml-2 md:-ml-4'>
                {carouselImages.map((imageUrl, index) => (
                  <CarouselItem
                    key={index}
                    className='pl-2 md:basis-1/2 lg:basis-1/3 md:pl-4'
                  >
                    <div
                      className={`relative overflow-hidden rounded-lg border ${isMosaic ? 'aspect-[4/5]' : 'aspect-square'
                        }`}
                    >
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
              {t('noImages')}
            </p>
          </div>
        )}

        {/* Grid de imágenes (vista completa) */}
        {galleryImages.length > 0 && (
          <div className='mb-12'>
            <h2 className='mb-6 text-2xl font-semibold'>{t('galleryTitle')}</h2>
            <div
              className={
                isMosaic
                  ? 'grid grid-cols-2 gap-4 grid-flow-dense auto-rows-[90px] sm:auto-rows-[100px] md:grid-cols-3 md:auto-rows-[110px] lg:grid-cols-4'
                  : 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              }
            >
              {galleryImages.map((imageUrl, index) => (
                <div
                  key={index}
                  className={
                    isMosaic
                      ? `group relative overflow-hidden rounded-xl border transition-shadow duration-300 hover:shadow-lg ${isEsencial
                        ? getEsencialTileClass(index)
                        : isPremium
                          ? getPremiumTileClass(index)
                          : getEliteTileClass(index)
                      }`
                      : 'group relative aspect-square overflow-hidden rounded-lg border transition-shadow duration-300 hover:shadow-lg'
                  }
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
                  <p className='m-0'>{t('pricePerMonth')}</p>
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
                  {t('getMembership')}
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
              <DialogTitle>{t('subscribe')} | {membershipName}</DialogTitle>
              <DialogDescription>
                {t('subscribeDescription')}
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
              {t('backToComparison')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

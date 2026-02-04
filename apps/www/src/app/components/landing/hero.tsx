'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export function Hero() {
  const i18n = useTranslations();

  return (
    <div className='bg-secondary dark:bg-black relative grid border-b'>
      <Carousel
        opts={{
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 5000,
          }),
        ]}
      >
        <CarouselContent>
          <CarouselItem
            key='hero-1'
            className='relative h-[75dvh] min-h-[500px] w-full'
          >
            <Image
              src='/assets/img/home1.jpg'
              alt={i18n('landing.hero.title')}
              className='h-full w-full object-cover object-top'
              fill
              priority
              quality={85}
              sizes="100vw"
            />
            <div
              data-odd={0 % 2 === 0 ? '' : null}
              className='max-w-desktop absolute inset-0 z-20 mx-auto flex w-full items-end p-6 data-odd:justify-end'
            >
              <Card className='relative overflow-visible w-full max-w-[80%] sm:max-w-xs md:max-w-xs dark:bg-black dark:border-white/10'>
                {/* Bordes decorativos florales dentro del card */}
                <div className='absolute -left-34 top-3 hidden h-full w-full md:block'>
                  <Image
                    src='/assets/img/heroboton.png'
                    alt=''
                    width={400}
                    height={2200}
                    className='h-26 w-full object-contain mb-4 '
                    aria-hidden='true'
                  />
                </div>
                <div className='absolute -right-35 top-3 hidden h-full w-full md:block'>
                  <Image
                    src='/assets/img/heroboton.png'
                    alt=''
                    width={400}
                    height={400}
                    className='h-26 w-full object-contain mb-4 scale-x-[-1]'
                    aria-hidden='true'
                  />
                </div>
                <CardHeader className='relative z-10'>
                  <CardTitle className='text-center capitalize font-cinzel'>
                    {i18n('landing.hero.title')}{' '}
                  </CardTitle>
                </CardHeader>
                <CardContent className='relative z-10 flex justify-center'>
                  <Link href={'/catalog/'}>
                    <Button>
                      {i18n('landing.hero.button')} <ChevronRight />{' '}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>

          <CarouselItem
            key='hero-2'
            className='relative h-[75dvh] min-h-[500px] w-full'
          >
            <Image
              src='/assets/img/home2.jpg'
              alt={i18n('landing.heros.title')}
              className='h-full w-full object-cover object-top'
              fill
              loading="lazy"
              quality={85}
              sizes="100vw"
            />
            <div
              data-odd={1 % 2 === 0 ? '' : null}
              className='max-w-desktop absolute inset-0 z-20 mx-auto flex w-full items-end p-6 data-odd:justify-end'
            >
              <Card className='relative overflow-visible w-full max-w-[80%] sm:max-w-xs md:max-w-xs dark:bg-black dark:border-white/10'>
                {/* Bordes decorativos florales dentro del card */}
                <div className='absolute -left-35 top-3 hidden h-full w-full md:block'>
                  <Image
                    src='/assets/img/heroboton.png'
                    alt=''
                    width={400}
                    height={2200}
                    className='h-26 w-full object-contain mb-4'
                    aria-hidden='true'
                  />
                </div>
                <div className='absolute -right-35 top-3 hidden h-full w-full md:block'>
                  <Image
                    src='/assets/img/heroboton.png'
                    alt=''
                    width={400}
                    height={2000}
                    className='h-26 w-full object-contain mb-4 scale-x-[-1]'
                    aria-hidden='true'
                  />
                </div>
                <CardHeader className='relative z-10'>
                  <CardTitle className='text-center capitalize font-cinzel'>
                    {i18n('landing.heros.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className='relative z-10 flex justify-center'>
                  <Link href={'/catalog/'}>
                    <Button>
                      {i18n('landing.heros.button')}
                      <ChevronRight />{' '}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>


          <CarouselItem
            key='hero-3'
            className='relative h-[75dvh] min-h-[500px] w-full'
          >
            <Image
              src='/assets/img/prueba.jpg'
              alt={i18n('landing.hero.title')}
              className='h-full w-full object-cover object-top'
              fill
              priority
              quality={85}
              sizes="100vw"
            />
            <div
              data-odd={0 % 2 === 0 ? '' : null}
              className='max-w-desktop absolute inset-0 z-20 mx-auto flex w-full items-end p-6 data-odd:justify-end'
            >
              <Card className='relative overflow-visible w-full max-w-[80%] sm:max-w-xs md:max-w-xs dark:bg-black dark:border-white/10'>
                {/* Bordes decorativos florales dentro del card */}
                <div className='absolute -left-34 top-3 hidden h-full w-full md:block'>
                  <Image
                    src='/assets/img/heroboton.png'
                    alt=''
                    width={400}
                    height={2200}
                    className='h-26 w-full object-contain mb-4 '
                    aria-hidden='true'
                  />
                </div>
                <div className='absolute -right-35 top-3 hidden h-full w-full md:block'>
                  <Image
                    src='/assets/img/heroboton.png'
                    alt=''
                    width={400}
                    height={400}
                    className='h-26 w-full object-contain mb-4 scale-x-[-1]'
                    aria-hidden='true'
                  />
                </div>
                <CardHeader className='relative z-10'>
                  <CardTitle className='text-center capitalize font-cinzel'>
                    {i18n('landing.hero.title')}{' '}
                  </CardTitle>
                </CardHeader>
                <CardContent className='relative z-10 flex justify-center'>
                  <Link href={'/catalog/'}>
                    <Button>
                      {i18n('landing.hero.button')} <ChevronRight />{' '}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        </CarouselContent>
      </Carousel>
    </div>
  );
}

'use client';

import { Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

export function AboutUs() {
  const t = useTranslations();

  return (
    <section className='px-4 py-12 lg:py-20'>
      <div className='max-w-desktop mx-auto'>
        <div className='relative aspect-[16/9] overflow-hidden rounded-xl md:aspect-[2/1]'>
          <Image
            src='/assets/img/aboutus.webp'
            alt='Flores'
            fill
            priority
            className='object-cover'
          />
          <div className='absolute right-0 bottom-0 left-0 p-6 md:right-auto md:left-6 md:max-w-xs'>
            <div className='rounded-2xl bg-white px-5 py-4 md:p-7'>
              <h3 className='text-lg font-bold text-black sm:text-2xl'>
                {t('landing.about-us.title')}
              </h3>
              <p className='mt-2 hidden text-gray-800 md:block'>
                {t('landing.about-us.description')}
              </p>
              <div className='mt-4 md:mt-12'>
                <a
                  href='#'
                  className='flex items-center gap-2 text-sm font-medium text-gray-800 hover:text-gray-500 focus:text-gray-500 focus:outline-none'
                >
                  <Play />
                  {t('landing.about-us.button')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

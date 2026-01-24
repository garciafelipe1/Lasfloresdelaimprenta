'use client';

import { useTranslations } from 'next-intl';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

type Testimonial = {
  name: string;
  role: string;
  image: string;
  quote: string;
  rating: number;
};

const testimonials: Testimonial[] = [
  {
    name: 'Jane D',
    role: 'CEO',
    image: 'https://pagedone.io/asset/uploads/1696229969.png',
    quote:
      'Pagedone has made it possible for me to stay on top of my portfolio and make informed decisions quickly and easily.',
    rating: 4.9,
  },
  {
    name: 'Harsh P.',
    role: 'Product Designer',
    image: 'https://pagedone.io/asset/uploads/1696229994.png',
    quote:
      'Thanks to pagedone, I feel more informed and confident about my investment decisions than ever before.',
    rating: 4.9,
  },
  {
    name: 'Alex K.',
    role: 'Design Lead',
    image: 'https://pagedone.io/asset/uploads/1696230027.png',
    quote:
      'The customer service team at pagedone went above and beyond to help me resolve a billing issue.',
    rating: 4.9,
  },
  // Duplicados para asegurar que el carrusel funcione con más de 3 slides
  {
    name: 'Jane D',
    role: 'CEO',
    image: 'https://pagedone.io/asset/uploads/1696229969.png',
    quote:
      'Pagedone has made it possible for me to stay on top of my portfolio and make informed decisions quickly and easily.',
    rating: 4.9,
  },
  {
    name: 'Harsh P.',
    role: 'Product Designer',
    image: 'https://pagedone.io/asset/uploads/1696229994.png',
    quote:
      'Thanks to pagedone, I feel more informed and confident about my investment decisions than ever before.',
    rating: 4.9,
  },
];

function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <div className='flex items-center gap-1 text-amber-500'>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className='h-4 w-4'
          viewBox='0 0 18 17'
          fill='currentColor'
          aria-hidden='true'
        >
          <path
            opacity={i < full ? 1 : 0.25}
            d='M8.10326 1.31699C8.47008 0.57374 9.52992 0.57374 9.89674 1.31699L11.7063 4.98347C11.8519 5.27862 12.1335 5.48319 12.4592 5.53051L16.5054 6.11846C17.3256 6.23765 17.6531 7.24562 17.0596 7.82416L14.1318 10.6781C13.8961 10.9079 13.7885 11.2389 13.8442 11.5632L14.5353 15.5931C14.6754 16.41 13.818 17.033 13.0844 16.6473L9.46534 14.7446C9.17402 14.5915 8.82598 14.5915 8.53466 14.7446L4.91562 16.6473C4.18199 17.033 3.32456 16.41 3.46467 15.5931L4.15585 11.5632C4.21148 11.2389 4.10393 10.9079 3.86825 10.6781L0.940384 7.82416C0.346867 7.24562 0.674378 6.23765 1.4946 6.11846L5.54081 5.53051C5.86652 5.48319 6.14808 5.27862 6.29374 4.98347L8.10326 1.31699Z'
          />
        </svg>
      ))}
      <span className='ml-1 text-sm font-semibold text-primary'>
        {value.toFixed(1)}
      </span>
    </div>
  );
}

export function Testimonials() {
  const t = useTranslations();

  return (
    <section className='py-24'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='mb-12 text-center'>
          <p className='text-sm text-primary/70 font-medium'>Opiniones reales</p>
          <h2 className='text-4xl font-bold text-primary font-cinzel mt-2'>
            {t('landing.testimonials.title')}
          </h2>
        </div>

        <Swiper
          className='mySwiper'
          modules={[Pagination, Autoplay]}
          slidesPerView={1}
          spaceBetween={32}
          loop={true}
          centeredSlides={true}
          pagination={{
            el: '.swiper-pagination',
            clickable: true,
          }}
          autoplay={{
            delay: 2500,
            disableOnInteraction: false,
          }}
          breakpoints={{
            640: {
              slidesPerView: 1,
              spaceBetween: 32,
            },
            768: {
              slidesPerView: 2,
              spaceBetween: 32,
            },
            1024: {
              slidesPerView: 3,
              spaceBetween: 32,
            },
          }}
        >
          {testimonials.map((testimonial, index) => (
            <SwiperSlide key={`${testimonial.name}-${index}`}>
              <article className='group bg-white/70 dark:bg-background border border-border/60 rounded-2xl p-6 shadow-sm transition-all duration-300 ease-out will-change-transform w-full mx-auto hover:shadow-md hover:-translate-y-1'>
                <Stars value={testimonial.rating} />

                <p className='mt-5 text-base text-primary/90 leading-relaxed'>
                  “{testimonial.quote}”
                </p>

                <div className='mt-6 flex items-center gap-4 border-t border-border/60 pt-5'>
                  <img
                    className='h-10 w-10 rounded-full object-cover'
                    src={testimonial.image}
                    alt={testimonial.name}
                    loading='lazy'
                  />
                  <div className='min-w-0'>
                    <p className='text-sm font-semibold text-primary truncate'>
                      {testimonial.name}
                    </p>
                    <p className='text-sm text-muted-foreground truncate'>
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </article>
            </SwiperSlide>
          ))}
          <div className='swiper-pagination'></div>
        </Swiper>
      </div>
    </section>
  );
}

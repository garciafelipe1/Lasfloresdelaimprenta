'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface NewsItem {
  id: number;
  title: string;
  excerpt: string;
  imageUrl: string;
  date: string;
}

const news: NewsItem[] = [
  {
    id: 1,
    title: 'VOLVIMOS AL DISEÑO',
    excerpt:
      'Tras un San Valentín con stock agotado, el taller de Soler 212 vuelve a estar operativo. Recibimos materia prima fresca y de alta gama para los pedidos de esta semana. Agenda abierta.',
    imageUrl:
      'https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/noticia-volvimos-al-diseno.jpg',
    date: '8 de Marzo, 2025',
  },
  {
    id: 2,
    title: 'COLECCIÓN 8M: ADMIRACIÓN',
    excerpt:
      'Este 8 de Marzo, el reconocimiento a la mujer se demuestra con excelencia. Ya estamos tomando pre-órdenes de nuestra nueva colección exclusiva. Asegurá tu diseño antes de que se agote.',
    imageUrl:
      'https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/noticia-coleccion-8m.jpg',
    date: '8 de Marzo, 2025',
  },
  {
    id: 3,
    title: 'IMAGEN CORPORATIVA',
    excerpt:
      'Elevamos la presencia de tu marca. Ofrecemos soluciones florales para regalos institucionales, fechas especiales y ambientación de oficinas o eventos. Consultá por propuestas a medida',
    imageUrl:
      'https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/noticia-imagen-corporativa.jpg',
    date: '1 de Marzo, 2025',
  },
  {
    id: 4,
    title: 'LA EXCELENCIA COMO HÁBITO',
    excerpt:
      'Suscribite a nuestras membresías y olvidate de gestionar pedidos. Recibí diseño floral fresco en tu hogar o empresa de forma automática, con la frecuencia que elijas',
    imageUrl:
      'https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/noticia-excelencia-habito.jpg',
    date: '15 de Febrero, 2025',
  },
];

export default function NewsSection() {
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (news.length === 0) return;

    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentNewsIndex((prevIndex) => (prevIndex + 1) % news.length);
        setIsFading(false);
      }, 500);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (news.length === 0) {
    return (
      <section className='bg-secondary rounded-xl p-6 shadow-md'>
        <h2 className='text-primary mb-6 text-center text-xl font-bold'>
          Últimas Noticias
        </h2>
        <div className='text-primary flex h-full items-center justify-center'>
          <p className='text-center text-lg'>
            Por el momento no hay noticias para mostrar.
          </p>
        </div>
      </section>
    );
  }

  const currentNews = news[currentNewsIndex];

  return (
    <section className='bg-secondary relative overflow-hidden rounded-xl p-6 shadow-md'>
      <h2 className='text-primary mb-6 text-center text-2xl font-bold'>
        Últimas Noticias
      </h2>

      <div className='relative min-h-[300px] md:min-h-[260px] lg:min-h-[240px]'>
        <div
          className={`absolute top-0 left-0 h-full w-full transition-opacity duration-500 ease-in-out ${isFading ? 'opacity-0' : 'opacity-100'}`}
        >
          <Link
            href={`/news/${currentNews.id}`}
            className='group block h-full'
          >
            <div className='flex h-full flex-col items-center gap-4'>
              <div className='relative h-40 w-full flex-shrink-0 overflow-hidden rounded-lg shadow-md'>
                <Image
                  src={currentNews.imageUrl}
                  alt={currentNews.title}
                  fill
                  sizes='100vw'
                  style={{ objectFit: 'cover' }}
                  className='transition-transform duration-300 group-hover:scale-105'
                />
              </div>
              <div className='mt-4 flex-grow text-center'>
                <h1 className='text-primary group-hover:text-primary/40 text-xl font-semibold transition-colors duration-200'>
                  {currentNews.title}
                </h1>

                <p className='text-primary/70 mt-1 line-clamp-2 text-base'>
                  {currentNews.excerpt}
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      <div className='mt-30 flex justify-center space-x-2'>
        {' '}
        {news.map((_, idx) => (
          <button
            key={idx}
            className={`h-2 w-2 rounded-full transition-all duration-300 ${currentNewsIndex === idx ? 'bg-primary w-4' : 'bg-primary/50 w-2'
              }`}
            onClick={() => {
              setIsFading(true);
              setTimeout(() => {
                setCurrentNewsIndex(idx);
                setIsFading(false);
              }, 300);
            }}
            aria-label={`Ir a la noticia ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

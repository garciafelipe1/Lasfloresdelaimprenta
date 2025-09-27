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
    title: '¡Gran Lanzamiento! Nuevas Funcionalidades Disponibles',
    excerpt:
      'Descubre las últimas características que hemos añadido para mejorar tu experiencia con nuestra plataforma.',
    imageUrl:
      'https://i.pinimg.com/736x/86/89/6f/86896fa8acddcd7ead4f386c4b2a6320.jpg',
    date: '05 de Junio, 2025',
  },
  {
    id: 2,
    title: 'Consejos para Optimizar tu Membresía Premium',
    excerpt:
      'Aprovecha al máximo todos los beneficios de tu membresía con nuestra guía detallada y exclusiva.',
    imageUrl:
      'https://i.pinimg.com/736x/86/89/6f/86896fa8acddcd7ead4f386c4b2a6320.jpg',
    date: '01 de Junio, 2025',
  },
  {
    id: 3,
    title: 'Evento Exclusivo: Webinar con Expertos del Sector',
    excerpt:
      'No te pierdas nuestro próximo webinar interactivo. Regístrate ahora y aprende de los mejores líderes de la industria.',
    imageUrl:
      'https://i.pinimg.com/736x/86/89/6f/86896fa8acddcd7ead4f386c4b2a6320.jpg',
    date: '28 de Mayo, 2025',
  },
  {
    id: 4,
    title: 'Caso de Éxito: Cómo Nuestros Usuarios Triunfan',
    excerpt:
      'Lee testimonios inspiradores y casos reales de cómo nuestra plataforma ayudó a usuarios como tú a alcanzar sus metas.',
    imageUrl:
      'https://i.pinimg.com/736x/86/89/6f/86896fa8acddcd7ead4f386c4b2a6320.jpg',
    date: '20 de Mayo, 2025',
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
            className={`h-2 w-2 rounded-full transition-all duration-300 ${
              currentNewsIndex === idx ? 'bg-primary w-4' : 'bg-primary/50 w-2'
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

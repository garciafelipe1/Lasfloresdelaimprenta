'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import NewsSection from '@/app/components/NewSection';
import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const [userMembership, setUserMembership] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const t = useTranslations(); 

 
  const membershipConfig: {
    [key: string]: {
      title: string;
      description: string;
      features: string[];
      bgColorClass: string;
      borderColorClass: string;
      accentColorClass: string;
    };
  } = {
    basico: {
      title: t('DashboardPage.membership.basico.title'), 
      description: t('DashboardPage.membership.basico.description'),
      features: [
        t('DashboardPage.membership.basico.features.0'), 
        t('DashboardPage.membership.basico.features.1'),
        t('DashboardPage.membership.basico.features.2'),
      ],
      bgColorClass: 'bg-secondary',
      borderColorClass: 'border-blue-400',
      accentColorClass: 'text-blue-600',
    },
    mediano: {
      title: t('DashboardPage.membership.mediano.title'),
      description: t('DashboardPage.membership.mediano.description'),
      features: [
        t('DashboardPage.membership.mediano.features.0'),
        t('DashboardPage.membership.mediano.features.1'),
        t('DashboardPage.membership.mediano.features.2'),
        t('DashboardPage.membership.mediano.features.3'),
      ],
      bgColorClass: 'bg-green-50',
      borderColorClass: 'border-green-400',
      accentColorClass: 'text-green-600',
    },
    premium: {
      title: t('DashboardPage.membership.premium.title'),
      description: t('DashboardPage.membership.premium.description'),
      features: [
        t('DashboardPage.membership.premium.features.0'),
        t('DashboardPage.membership.premium.features.1'),
        t('DashboardPage.membership.premium.features.2'),
        t('DashboardPage.membership.premium.features.3'),
      ],
      bgColorClass: 'bg-purple-50',
      borderColorClass: 'border-purple-400',
      accentColorClass: 'text-purple-600',
    },
  };

  useEffect(() => {
    const fetchMembership = setTimeout(() => {
      if (typeof window !== 'undefined') {
        const storedMembership = localStorage.getItem('userMembership');
        if (storedMembership) {
          setUserMembership(storedMembership);
        }
      }
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(fetchMembership);
  }, []);

  const renderMembershipInfo = () => {
    if (isLoading) {
      return (
        <div className='flex h-full flex-col items-center justify-center'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='text-primary mr-2 h-7 w-7 animate-spin'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M21 12a9 9 0 1 1-6.219-8.56' />
          </svg>
          <p className='text-primary text-lg font-semibold'>
            {t('DashboardPage.loadingMembership.text')}
          </p>
        </div>
      );
    }

    if (!userMembership) {
      return (
        <div className='flex h-full flex-col items-center justify-center p-4 text-center'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='mb-4 h-12 w-12 text-yellow-500'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' />
            <line
              x1='12'
              y1='9'
              x2='12'
              y2='13'
            />
            <line
              x1='12'
              y1='17'
              x2='12.01'
              y2='17'
            />
          </svg>
          <p className='text-primary mb-4 text-xl font-semibold'>
            {t('DashboardPage.noMembership.title')}
          </p>
          <Link
            href='/planes'
            className='bg-primary text-secondary hover:bg-primary/80 rounded-lg px-6 py-2 font-semibold transition-colors duration-200'
          >
            {t('DashboardPage.noMembership.explorePlansButton')}
          </Link>
        </div>
      );
    }

    const membership = membershipConfig[userMembership];

    if (!membership) {
      return (
        <div className='flex h-full flex-col items-center justify-center p-4 text-center'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='mb-4 h-12 w-12 text-red-500'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <circle
              cx='12'
              cy='12'
              r='10'
            />
            <line
              x1='12'
              y1='8'
              x2='12'
              y2='12'
            />
            <line
              x1='12'
              y1='16'
              x2='12.01'
              y2='16'
            />
          </svg>
          <p className='text-primary mb-4 text-xl font-semibold'>
            {t('DashboardPage.unknownMembership.title')}
          </p>
          <Link
            href='/soporte'
            className='bg-primary text-secondary hover:bg-primary/80 rounded-lg px-6 py-2 font-semibold transition-colors duration-200'
          >
            {t('DashboardPage.unknownMembership.supportButton')}
          </Link>
        </div>
      );
    }

    return (
      <div
        className={`rounded-xl border ${membership.borderColorClass} ${membership.bgColorClass} p-6 shadow-lg transition-all duration-300 hover:shadow-xl`}
      >
        <div className='flex items-center justify-between'>
          <h2 className='text-primary mb-3 text-3xl font-bold'>
            {membership.title}
          </h2>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className={`h-8 w-8 ${membership.accentColorClass}`}
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M4.5 16.5c-1.5 1.5-1.5 3.5 0 5s3.5 0 5-1.5L20.5 7.5c1.5-1.5 1.5-3.5 0-5s-3.5 0-5 1.5L4.5 16.5z' />
            <path d='M9 10L14 15' />
            <path d='M10 9L15 14' />
            <path d='M11 8L16 13' />
          </svg>
        </div>
        <p className='text-primary mb-6'>{membership.description}</p>

        <h3 className='text-primary mb-3 text-xl font-semibold'>
          {t('DashboardPage.membershipFeaturesTitle')}
        </h3>
        <ul className='text-primary space-y-2'>
          {membership.features.map((feature, index) => (
            <li
              key={index}
              className='flex items-center'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className={`mr-2 h-5 w-5 ${membership.accentColorClass}`}
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <path d='M20 6L9 17l-5-5' />
              </svg>
              {feature}
            </li>
          ))}
        </ul>

        <div className='mt-8 text-right'>
          <button
            className={`bg-primary text-secondary hover:bg-primary/80 rounded-lg px-6 py-2 font-semibold transition-colors duration-200`}
          >
            {t('DashboardPage.manageMembershipButton')}
          </button>
        </div>
      </div>
    );
  };

  return (
    <section className='container mx-auto px-4 py-8'>
      <div className='mb-10 text-center'>
        <h1 className='text-primary mb-2 text-4xl font-extrabold md:text-3xl'>
          {t('DashboardPage.welcomeTitle')}
        </h1>
        <p className='text-primary text-lg md:text-xl'>
          {t('DashboardPage.welcomeSubtitle')}
        </p>
      </div>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
        <section className='bg-secondary col-span-1 rounded-xl p-6 shadow-md md:col-span-2'>
          <h2 className='text-primary mb-6 text-2xl font-bold'>
            {t('DashboardPage.membershipSectionTitle')}
          </h2>
          {renderMembershipInfo()}
        </section>

        <NewsSection />

        
      </div>
    </section>
  );
}

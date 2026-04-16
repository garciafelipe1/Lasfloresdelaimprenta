import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { ArrowRight, Check, Sparkles, Heart, Award, Phone, Mail } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { WhatsAppIcon } from '@/app/components/icons/whatsapp-icon';
import { getCheerfulServiceWhatsAppText, getWhatsAppUrl } from '@/lib/whatsapp';

interface ServiceDetailPageProps {
  slug: string;
  locale: string;
  title: string;
  subtitle: string;
  description: string;
  images: string[];
  ctaText: string;
  benefits?: string[];
  features?: string[];
  translations: {
    whyChooseUs: string;
    ourWork: string;
    whatIncludes: string;
    readyToTransform: string;
    contactToday: string;
    callNow: string;
    sendEmail: string;
    requestQuote: string;
    viewGallery: string;
    premiumService: string;
    /** Solo Bodas: pie de la cabecera de galería */
    galleryTagline?: string;
    /** Solo Bodas: texto del badge sobre el título */
    portfolioLabel?: string;
  };
}

export default function ServiceDetailPage({
  slug,
  description,
  images,
  subtitle,
  title,
  ctaText,
  benefits = [],
  features = [],
  translations,
}: ServiceDetailPageProps) {
  const heroImage = images?.[0] || '/assets/img/service.webp';
  const galleryImages = (images || []).slice(1).filter(Boolean);

  const getGalleryTileClass = (index: number) => {
    // Mosaico editorial: variación sin romper responsive.
    // - base: 1 columna (sin huecos)
    // - sm: 2 columnas
    // - lg: 3 columnas
    switch (index % 8) {
      case 0:
        return 'sm:col-span-2 sm:row-span-2 lg:col-span-2';
      case 1:
        return 'row-span-2';
      case 2:
        return 'lg:row-span-2';
      case 3:
        return 'sm:row-span-2';
      case 4:
        return 'lg:col-span-2';
      default:
        return '';
    }
  };

  /** Contenedor de grid Bodas según cantidad de fotos (sin huecos en desktop). */
  const getBodasGalleryGridClass = (total: number) => {
    const base =
      'grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-5 md:gap-6 lg:gap-6';
    if (total === 3) {
      return `${base} lg:grid-cols-12 lg:grid-rows-[minmax(280px,1fr)_minmax(280px,1fr)]`;
    }
    if (total === 4) {
      return `${base} lg:grid-cols-12 lg:grid-rows-[minmax(260px,1.1fr)_minmax(260px,1.1fr)_minmax(300px,1.2fr)]`;
    }
    if (total === 5) {
      return `${base} lg:grid-cols-12 lg:grid-rows-[minmax(240px,1fr)_minmax(240px,1fr)_minmax(260px,1.15fr)]`;
    }
    return `${base} lg:grid-cols-3`;
  };

  /** Celdas Bodas: bento asimétrico; mobile/tablet apilado o 2 cols sin huecos. */
  const getBodasGalleryTileClass = (index: number, total: number) => {
    const min = 'min-h-[260px] sm:min-h-[280px]';
    if (total === 3) {
      switch (index) {
        case 0:
          return `${min} sm:col-span-2 lg:col-span-7 lg:row-span-2 lg:min-h-0 h-full lg:min-h-[520px]`;
        case 1:
          return `${min} lg:col-span-5 lg:row-span-1 lg:min-h-0`;
        case 2:
          return `${min} lg:col-span-5 lg:row-span-1 lg:min-h-0`;
        default:
          return `${min} sm:col-span-2 lg:col-span-6`;
      }
    }
    if (total === 4) {
      switch (index) {
        case 0:
          return `${min} sm:col-span-2 lg:col-span-7 lg:row-span-2 lg:min-h-0 h-full lg:min-h-[560px]`;
        case 1:
          return `${min} lg:col-span-5 lg:row-span-1 lg:min-h-0`;
        case 2:
          return `${min} lg:col-span-5 lg:row-span-1 lg:min-h-0`;
        case 3:
          return `${min} sm:col-span-2 lg:col-span-12 lg:row-span-1 lg:min-h-[min(360px,42vh)]`;
        default:
          return `${min} sm:col-span-2`;
      }
    }
    if (total === 5) {
      switch (index) {
        case 0:
          return `${min} sm:col-span-2 sm:min-h-[300px] lg:col-span-7 lg:row-span-2 lg:min-h-0 h-full`;
        case 1:
          return `${min} lg:col-span-5 lg:row-span-1 lg:min-h-0`;
        case 2:
          return `${min} lg:col-span-5 lg:row-span-1 lg:min-h-0`;
        case 3:
          return `${min} lg:col-span-4 lg:row-span-1 lg:min-h-0`;
        case 4:
          return `${min} lg:col-span-8 lg:row-span-1 lg:min-h-0`;
        default:
          return `${min} sm:col-span-2 lg:col-span-6`;
      }
    }
    return `${min} sm:col-span-2 lg:col-span-1`;
  };

  return (
    <div className='min-h-screen service-detail-page'>
      {/* Hero Section */}
      <section className='relative overflow-hidden bg-gradient-to-b from-background to-secondary/30'>
        <div className='max-w-desktop mx-auto px-layout py-16 md:py-24'>
          <div className='grid md:grid-cols-2 gap-12 items-center'>
            <div className='space-y-6'>
              <Badge variant='secondary' className='w-fit'>
                <Sparkles className='w-3 h-3 mr-2' />
                {translations.premiumService}
              </Badge>
              <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary'>
                {title}
              </h1>
              <p className='text-xl text-muted-foreground leading-relaxed'>
                {subtitle}
              </p>
              <div className='flex flex-col sm:flex-row gap-4 pt-4'>
                <Button size='lg' className='text-base px-8 py-6 group' asChild>
                  <Link href='#contacto'>
                    {ctaText}
                    <ArrowRight className='ml-2 w-5 h-5 transition-transform group-hover:translate-x-1' />
                  </Link>
                </Button>
                <Button size='lg' variant='outline' className='text-base px-8 py-6' asChild>
                  <Link href='#galeria'>
                    {translations.viewGallery}
                  </Link>
                </Button>
              </div>
            </div>
            <div className='relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl'>
              <Image
                src={heroImage}
                alt={`${title} - Imagen principal`}
                fill
                className='object-cover'
                priority
                sizes='(max-width: 768px) 100vw, 50vw'
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      {benefits.length > 0 && (
        <section className='py-16 bg-secondary/50'>
          <div className='max-w-desktop mx-auto px-layout'>
            <h2 className='text-3xl font-bold text-center mb-12 text-primary'>
              {translations.whyChooseUs}
            </h2>
            <div className='grid md:grid-cols-3 gap-6'>
              {benefits.map((benefit, index) => (
                <Card key={index} className='border-2 hover:border-primary/50 transition-colors'>
                  <CardContent className='pt-6'>
                    <div className='flex items-start gap-4'>
                      <div className='rounded-full bg-primary/10 p-2'>
                        <Check className='w-5 h-5 text-primary' />
                      </div>
                      <p className='text-primary font-medium leading-relaxed'>{benefit}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Description Section */}
      <section className='py-16'>
        <div className='max-w-desktop mx-auto px-layout'>
          <div className='max-w-3xl mx-auto'>
            <div
              className='prose prose-lg max-w-none text-primary/90 leading-relaxed'
              dangerouslySetInnerHTML={{ __html: description }}
            />
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section
        id='galeria'
        className={`relative py-16 md:py-20 ${slug === 'bodas' ? 'overflow-hidden bg-gradient-to-b from-secondary/40 via-primary/[0.06] to-secondary/30' : 'bg-secondary/30'}`}
      >
        {slug === 'bodas' ? (
          <>
            <div
              className='pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl'
              aria-hidden
            />
            <div
              className='pointer-events-none absolute -right-20 bottom-1/4 h-80 w-80 rounded-full bg-violet-400/15 blur-3xl'
              aria-hidden
            />
            <div
              className='pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,hsl(var(--primary)/0.04)_50%,transparent_100%)]'
              aria-hidden
            />
          </>
        ) : null}
        <div className={`relative z-10 max-w-desktop mx-auto px-layout ${slug === 'bodas' ? '' : ''}`}>
          {slug === 'bodas' ? (
            <div className='mb-10 flex flex-col items-center gap-3 text-center md:mb-14'>
              <span className='inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary shadow-sm backdrop-blur-sm'>
                <Heart className='h-3.5 w-3.5 fill-primary/20 text-primary' aria-hidden />
                {translations.portfolioLabel ?? 'Portfolio'}
              </span>
              <h2 className='bg-gradient-to-br from-primary via-primary to-primary/70 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-4xl lg:text-[2.75rem]'>
                {translations.ourWork}
              </h2>
              {translations.galleryTagline ? (
                <p className='max-w-lg text-sm text-muted-foreground md:text-base'>
                  {translations.galleryTagline}
                </p>
              ) : null}
            </div>
          ) : (
            <h2 className='text-3xl font-bold text-center mb-12 text-primary'>
              {translations.ourWork}
            </h2>
          )}
          {galleryImages.length > 0 ? (
            slug === 'bodas' ? (
              <div className={getBodasGalleryGridClass(galleryImages.length)}>
                {galleryImages.map((src, index) => (
                  <div
                    key={`${src}-${index}`}
                    className={`group relative overflow-hidden rounded-3xl border border-white/40 bg-background/90 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.22)] backdrop-blur-[2px] transition-all duration-500 ease-out hover:z-10 hover:-translate-y-1.5 hover:shadow-[0_32px_70px_-12px_rgba(0,0,0,0.28)] hover:ring-2 hover:ring-primary/25 ${index === 0 ? 'ring-2 ring-primary/20' : ''} ${getBodasGalleryTileClass(index, galleryImages.length)}`}
                  >
                    <Image
                      src={src}
                      alt={`${title} - Galería ${index + 1}`}
                      fill
                      className='object-cover transition-transform duration-700 ease-out group-hover:scale-105'
                      sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 40vw, 520px'
                      loading={index < 3 ? 'eager' : 'lazy'}
                      quality={90}
                    />
                    <div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100' />
                    <div className='pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100' />
                  </div>
                ))}
              </div>
            ) : (
              <div className='grid grid-cols-1 gap-4 grid-flow-dense auto-rows-[160px] sm:grid-cols-2 sm:auto-rows-[180px] sm:gap-4 lg:grid-cols-3 lg:auto-rows-[200px] lg:gap-4'>
                {galleryImages.map((src, index) => (
                  <div
                    key={`${src}-${index}`}
                    className={`group relative overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm transition-all duration-300 hover:shadow-md ${getGalleryTileClass(index)}`}
                  >
                    <Image
                      src={src}
                      alt={`${title} - Galería ${index + 1}`}
                      fill
                      className='object-cover transition-transform duration-500 group-hover:scale-110'
                      sizes='(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw'
                      loading={index < 3 ? 'eager' : 'lazy'}
                      quality={85}
                    />
                    <div className='absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10' />
                  </div>
                ))}
              </div>
            )
          ) : null}
        </div>
      </section>

      {/* Features Section */}
      {features.length > 0 && (
        <section className='py-16'>
          <div className='max-w-desktop mx-auto px-layout'>
            <h2 className='text-3xl font-bold text-center mb-12 text-primary'>
              {translations.whatIncludes}
            </h2>
            <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6'>
              {features.map((feature, index) => (
                <div key={index} className='text-center space-y-3'>
                  <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4'>
                    <Award className='w-8 h-8 text-primary' />
                  </div>
                  <p className='text-primary font-medium'>{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section id='contacto' className='py-20 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground'>
        <div className='max-w-desktop mx-auto px-layout text-center space-y-8'>
          <div className='space-y-4'>
            <h2 className='text-4xl md:text-5xl font-bold'>
              {translations.readyToTransform}
            </h2>
            <p className='text-xl text-primary-foreground/90 max-w-2xl mx-auto'>
              {translations.contactToday}
            </p>
          </div>
          <div className='flex flex-col sm:flex-row gap-4 justify-center items-center pt-6'>
            <Button
              size='lg'
              className='text-base px-8 py-6 bg-[#25D366] hover:bg-[#1ebe5d] text-white border border-transparent'
              asChild
            >
              <Link
                href={getWhatsAppUrl({
                  text: getCheerfulServiceWhatsAppText(title),
                })}
                target='_blank'
                rel='noopener noreferrer'
              >
                <WhatsAppIcon className='mr-2 w-5 h-5' />
                {translations.requestQuote}
              </Link>
            </Button>
            <Button size='lg' variant='outline' className='text-base px-8 py-6 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 group' asChild>
              <Link href='mailto:contacto@lafloreria.com'>
                <Mail className='mr-2 w-5 h-5' />
                {translations.sendEmail}
              </Link>
            </Button>
            <Button
              size='lg'
              variant='outline'
              className='text-base px-8 py-6 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 group'
              asChild
            >
              <Link href='tel:+5491123456789'>
                <Phone className='mr-2 w-5 h-5' />
                {translations.callNow}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

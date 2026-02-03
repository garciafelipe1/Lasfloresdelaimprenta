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
      <section id='galeria' className='py-16 bg-secondary/30'>
        <div className='max-w-desktop mx-auto px-layout'>
          <h2 className='text-3xl font-bold text-center mb-12 text-primary'>
            {translations.ourWork}
          </h2>
          {galleryImages.length > 0 ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 grid-flow-dense auto-rows-[160px] sm:auto-rows-[180px] lg:auto-rows-[200px]'>
              {galleryImages.map((src, index) => (
                // Bodas: forzar una pieza vertical para bodas-8 en "Nuestros trabajos"
                // (más alto, estilo portrait)
                <div
                  key={`${src}-${index}`}
                  className={`group relative overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm transition-all duration-300 hover:shadow-md ${slug === 'bodas' && src.includes('/assets/img/services/bodas/bodas-7.')
                      ? 'row-span-1 sm:row-span-1 lg:row-span-3'
                      : getGalleryTileClass(index)
                    }`}
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

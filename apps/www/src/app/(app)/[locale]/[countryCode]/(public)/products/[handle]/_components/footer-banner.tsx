import Image from 'next/image';

const SAN_VALENTIN_BANNER_URL =
  'https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/Banner%20d%C3%ADa%20la%20mujer.jpg';

export function FooterBanner() {
  return (
    <div className='relative w-full overflow-hidden rounded-xl bg-muted/30'>
      <div className='relative w-full min-h-[180px] h-[min(400px,50vw)] sm:min-h-[220px] sm:h-[min(450px,45vw)] md:min-h-[260px] md:h-[min(500px,40vw)] lg:min-h-[300px] lg:h-[min(550px,35vw)] xl:min-h-[340px] xl:h-[min(600px,30vw)]'>
        <Image
          className='h-full w-full object-contain object-center'
          fill
          src={SAN_VALENTIN_BANNER_URL}
          alt='Banner Diseños Exclusivos'
          sizes='(max-width: 480px) 100vw, (max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1024px'
          priority={false}
        />
      </div>
    </div>
  );
}

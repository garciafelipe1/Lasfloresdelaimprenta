import Image from 'next/image';

export default function Fond() {
  return (
    <section className='bg-secondary relative'>
      {/* Imagen para mobile */}
      <Image
        src='https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/Login%20celu.jpg'
        className='h-full w-full object-cover md:hidden'
        alt='Fond'
        fill
      />
      {/* Imagen para desktop */}
      <Image
        src='/assets/img/login.jpg'
        className='hidden h-full w-full object-cover md:block'
        alt='Fond'
        fill
      />
    </section>
  );
}

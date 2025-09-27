import Image from 'next/image';

export default function Fond() {
  return (
    <section className='bg-secondary relative'>
      <Image
        src='/assets/img/aboutus.webp'
        className='h-full w-full object-cover'
        alt='Fond'
        fill
      />
    </section>
  );
}

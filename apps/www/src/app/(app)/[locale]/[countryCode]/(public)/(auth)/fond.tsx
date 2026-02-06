import Image from 'next/image';

export default function Fond() {
  return (
    <section className='bg-secondary relative'>
      <Image
        src='/assets/img/login.jpg'
        className='h-full w-full object-cover'
        alt='Fond'
        fill
      />
    </section>
  );
}

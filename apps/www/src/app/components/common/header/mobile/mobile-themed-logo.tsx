import Image from 'next/image';
import Link from 'next/link';

export function MobileThemedLogo() {
  return (
    <Link href='/'>
      <Image
        src='/assets/img/logo3.png'
        alt='Logo Flores Imprenta'
        height={60}
        width={60}
        className='h-25 w-100 object-contain dark:invert mt-2 '
      />
    </Link>
  );
}

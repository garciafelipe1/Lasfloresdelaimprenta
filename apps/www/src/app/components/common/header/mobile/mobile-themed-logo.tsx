import Image from 'next/image';
import Link from 'next/link';

interface Props {
  className?: string;
}

export function MobileThemedLogo({ className }: Props) {
  return (
    <Link href='/'>
      <Image
        src='/assets/img/logo3.png'
        alt='Logo Flores Imprenta'
        height={64}
        width={320}
        className={`h-auto w-auto object-contain dark:invert ${className ?? ''}`.trim()}
        priority
      />
    </Link>
  );
}

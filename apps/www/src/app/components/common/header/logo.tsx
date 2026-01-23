import Image from 'next/image';
import Link from 'next/link';

export function Logo() {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center mt-4 mb-1">
      <Link href="/" className="block mt-10.5 md:mt-0">
        <Image
          src="/assets/img/logodelaimprenta.svg"
          alt="Logo Flores Imprenta"
          width={160}
          height={100}
          className="object-contain dark:invert"
          priority
        />
      </Link>
    </div>
  );
}

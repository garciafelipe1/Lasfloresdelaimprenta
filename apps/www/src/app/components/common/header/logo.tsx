import Image from 'next/image';
import Link from 'next/link';

export function Logo() {
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
      <Link href="/" className="block">
        <Image
          src="/assets/img/logo3.png"
          alt="Logo Flores Imprenta"
          width={180}
          height={120}
          className="object-contain dark:invert lg:scale-[1.08] mt-10 md:mt-0"
          priority
        />
      </Link>
    </div>
  );
}

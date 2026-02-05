import Link from 'next/link';
import { WhatsAppIcon } from '@/app/components/icons/whatsapp-icon';
import { Button } from '@/app/components/ui/button';
import { getCheerfulReserveWhatsAppText, getWhatsAppUrl } from '@/lib/whatsapp';

export function WhatsAppReserveFloating() {
  const href = getWhatsAppUrl({
    text: getCheerfulReserveWhatsAppText(),
  });

  return (
    <div className='fixed z-50 right-4 bottom-4 md:right-6 md:bottom-6'>
      <Button
        asChild
        size='lg'
        className='rounded-full shadow-lg bg-[#25D366] hover:bg-[#1ebe5d] text-white border border-transparent gap-2'
      >
        <Link
          href={href}
          target='_blank'
          rel='noopener noreferrer'
          aria-label='Reservar por WhatsApp'
        >
          <WhatsAppIcon className='h-5 w-5' />
          <span className='hidden sm:inline'>Reservar</span>
        </Link>
      </Button>
    </div>
  );
}


import { TicketX } from 'lucide-react';

export function SubEmpty() {
  return (
    <div className='flex flex-col items-center justify-center gap-6 md:gap-8 py-12 md:py-20 text-center px-4'>
      <TicketX className='h-10 w-10 md:h-12 md:w-12' />
      <h3 className='text-lg md:text-xl font-semibold'>¡Aún no sos miembro!</h3>
      <p className='text-sm md:text-base text-muted-foreground max-w-md'>
        Suscribite para acceder a descuentos exclusivos y empezar a disfrutar de
        todos los beneficios que tenemos para vos.
      </p>
    </div>
  );
}

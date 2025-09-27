import { TicketX } from 'lucide-react';

export function SubEmpty() {
  return (
    <div className='flex flex-col items-center justify-center gap-8 py-20 text-center'>
      <TicketX size={48} />
      <h3 className='text-xl font-semibold'>¡Aún no sos miembro!</h3>
      <p className='text-muted-foreground max-w-md'>
        Suscribite para acceder a descuentos exclusivos y empezar a disfrutar de
        todos los beneficios que tenemos para vos.
      </p>
    </div>
  );
}

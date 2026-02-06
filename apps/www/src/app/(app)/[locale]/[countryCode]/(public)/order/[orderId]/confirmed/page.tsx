import { CheckCheckIcon } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { getWhatsAppUrl } from '@/lib/whatsapp';

interface Props {
  params: Promise<{ orderId: string }>;
  searchParams?: Promise<{ shipping?: string }>;
}

export default async function ConfirmedPage(props: Props) {
  const { orderId } = await props.params;
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const shouldShowShippingToConfirm = searchParams?.shipping === 'confirm';

  const whatsappText = [
    'Hola, realicé una compra y necesito tasar el envío para recibir mi pedido.',
    '',
    `Número de pedido: #${orderId}`,
  ].join('\n');
  const whatsappUrl = getWhatsAppUrl({ text: whatsappText });

  return (
    <div className='bg-secondary flex flex-col items-center justify-center border-b py-20 text-center'>
      <div className='text-background rounded-full bg-green-600 p-4'>
        <CheckCheckIcon />
      </div>
      <h4 className='mt-4 text-xl font-semibold text-green-500'>
        ¡Gracias por tu compra!
      </h4>
      <p className='mt-2'>
        Hemos recibido tu pedido{' '}
        <span className='font-semibold'>#{orderId}</span> correctamente.
      </p>
      {shouldShowShippingToConfirm ? (
        <div className='mt-6 w-full max-w-md px-6'>
          <Button asChild size='lg' className='w-full'>
            <a href={whatsappUrl}>
              Tasar envío para recibir mi pedido
            </a>
          </Button>
        </div>
      ) : null}
      <p className='mt-1 text-sm'>
        Te enviaremos un correo con los detalles y próximos pasos. Si tenés
        alguna duda, no dudes en contactarnos.
      </p>
    </div>
  );
}

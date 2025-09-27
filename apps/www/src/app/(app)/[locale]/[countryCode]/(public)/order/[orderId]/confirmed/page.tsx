import { CheckCheckIcon } from 'lucide-react';

interface Props {
  params: Promise<{ orderId: string }>;
}

export default async function ConfirmedPage(props: Props) {
  const { orderId } = await props.params;

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
      <p className='mt-1 text-sm'>
        Te enviaremos un correo con los detalles y próximos pasos. Si tenés
        alguna duda, no dudes en contactarnos.
      </p>
    </div>
  );
}

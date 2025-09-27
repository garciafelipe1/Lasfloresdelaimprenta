import Link from 'next/link';

export default function NotFound() {
  return (
    <div className='flex h-full flex-col items-center justify-center px-4 text-center'>
      <h1 className='mb-4 text-4xl font-bold'>Producto no encontrado</h1>
      <p className='mb-6'>
        El producto que estás buscando no existe o fue movido.
      </p>
      <Link
        href='/catalog'
        className='text-blue-500 hover:underline'
      >
        Volver al catálogo
      </Link>
    </div>
  );
}

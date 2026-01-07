'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function MembershipSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'pending'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const preapprovalId = searchParams.get('preapproval_id');
    
    if (!preapprovalId) {
      setStatus('error');
      setMessage('No se recibió el ID de la suscripción. Por favor, contacta con soporte.');
      return;
    }

    let retryTimeout: NodeJS.Timeout | null = null;
    let isMounted = true;

    // Verificar el estado del PreApproval y crear la suscripción si es necesario
    const verifySubscription = async () => {
      if (!isMounted) return;
      try {
        console.log('[MembershipSuccess] Verificando PreApproval:', preapprovalId);
        
        // En el cliente, solo podemos acceder a variables con prefijo NEXT_PUBLIC_
        const medusaBackendUrl = 
          process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
          process.env.NEXT_PUBLIC_BACKEND_URL ||
          process.env.NEXT_PUBLIC_API_URL ||
          '';
        
        console.log('[MembershipSuccess] MEDUSA_BACKEND_URL resuelto:', medusaBackendUrl);
        
        if (!medusaBackendUrl) {
          throw new Error('MEDUSA_BACKEND_URL no está configurado. Verifica que NEXT_PUBLIC_MEDUSA_BACKEND_URL tenga un valor válido en Railway.');
        }

        const response = await fetch(
          `${medusaBackendUrl}/membership/subscription?preapproval_id=${preapprovalId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
          throw new Error(errorData.message || `Error ${response.status}`);
        }

        const data = await response.json();
        console.log('[MembershipSuccess] Respuesta del backend:', data);

        console.log('[MembershipSuccess] Estado de la respuesta:', {
          success: data.success,
          message: data.message,
          status: data.status,
          subscription: data.subscription ? 'presente' : 'ausente',
        });

        if (data.success) {
          if (data.message === 'Subscription created successfully' || data.message === 'Subscription already exists') {
            setStatus('success');
            setMessage(data.message === 'Subscription created successfully' 
              ? '¡Tu suscripción se ha activado correctamente!' 
              : '¡Tu suscripción ya está activa!');
            
            // Redirigir al dashboard después de 3 segundos
            setTimeout(() => {
              router.push('/es/ar/dashboard');
            }, 3000);
          } else {
            // Si success es true pero el mensaje no es de creación exitosa, 
            // puede ser que el PreApproval aún esté en "pending"
            setStatus('pending');
            setMessage(data.message || 'Tu pago está siendo procesado. Te notificaremos cuando tu suscripción esté activa.');
            
            // Si el status es "pending", intentar verificar nuevamente después de 5 segundos
            if (data.status === 'pending') {
              console.log('[MembershipSuccess] PreApproval en estado "pending". Reintentando verificación en 5 segundos...');
              retryTimeout = setTimeout(() => {
                if (isMounted) {
                  verifySubscription();
                }
              }, 5000);
            }
          }
        } else {
          // Si success es false, verificar el status
          if (data.status === 'pending') {
            setStatus('pending');
            setMessage('Tu pago está siendo procesado. MercadoPago está verificando tu pago. Intentaremos verificar nuevamente en unos momentos...');
            
            // Reintentar verificación después de 5 segundos
            console.log('[MembershipSuccess] PreApproval en estado "pending". Reintentando verificación en 5 segundos...');
            retryTimeout = setTimeout(() => {
              if (isMounted) {
                verifySubscription();
              }
            }, 5000);
          } else {
            setStatus('error');
            setMessage(data.message || 'Hubo un problema al procesar tu suscripción. Por favor, contacta con soporte.');
          }
        }
      } catch (error: any) {
        console.error('[MembershipSuccess] Error al verificar suscripción:', error);
        if (isMounted) {
          setStatus('error');
          setMessage(error.message || 'Hubo un error al verificar tu suscripción. Por favor, contacta con soporte.');
        }
      }
    };

    verifySubscription();

    // Cleanup: cancelar el timeout si el componente se desmonta
    return () => {
      isMounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [searchParams, router]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        {status === 'loading' && (
          <>
            <div className="mb-8">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
            </div>
            <h1 className="text-3xl font-bold mb-4">Procesando tu suscripción...</h1>
            <p className="text-lg text-muted-foreground">
              Por favor, espera mientras verificamos tu pago.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-8">
              <svg
                className="mx-auto h-16 w-16 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-4 text-green-600">
              ¡Suscripción activada!
            </h1>
            <p className="text-lg text-muted-foreground mb-8">{message}</p>
            <p className="text-sm text-muted-foreground">
              Serás redirigido al dashboard en unos segundos...
            </p>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="mb-8">
              <svg
                className="mx-auto h-16 w-16 text-yellow-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-4 text-yellow-600">
              Procesando tu pago
            </h1>
            <p className="text-lg text-muted-foreground mb-8">{message}</p>
            <p className="text-sm text-muted-foreground">
              Te notificaremos por email cuando tu suscripción esté activa.
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-8">
              <svg
                className="mx-auto h-16 w-16 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-4 text-red-600">
              Error al procesar tu suscripción
            </h1>
            <p className="text-lg text-muted-foreground mb-8">{message}</p>
            <button
              onClick={() => router.push('/es/ar/dashboard')}
              className="bg-primary text-secondary px-6 py-2 rounded-lg font-semibold hover:bg-primary/80 transition-colors"
            >
              Volver al dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}


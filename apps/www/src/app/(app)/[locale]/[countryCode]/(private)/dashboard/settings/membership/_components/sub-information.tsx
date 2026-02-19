'use client';

import {
  Section,
  SectionHeader,
  SectionTitle,
} from '@/app/components/common/section/section';
import { SubscriptionWithMembership } from '@/common/dto/subscription.dto';
import { differenceInCalendarDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { useRouter } from 'next/navigation';

interface Props {
  subscription: SubscriptionWithMembership;
}

export function SubInformation({ subscription }: Props) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { membership, status, started_at, ended_at } = subscription;

  const formattedStart = format(
    new Date(started_at),
    "dd 'de' MMMM 'de' yyyy",
    {
      locale: es,
    },
  );

  const formattedEnd = ended_at
    ? format(new Date(ended_at), "dd 'de' MMMM 'de' yyyy", { locale: es })
    : null;

  // Verificar si la membresía está expirada
  const now = new Date();
  const endDate = ended_at ? new Date(ended_at) : null;
  const isExpired = endDate ? endDate < now : false;
  const isCancelled = status === 'cancelled';
  const isActive = status === 'active' && !isExpired;

  const differenceDays = ended_at
    ? differenceInCalendarDays(new Date(), new Date(ended_at))
    : 0;

  const handleCancel = async () => {
    if (!confirm('¿Estás seguro de que deseas cancelar tu membresía? Esta acción no se puede deshacer.')) {
      return;
    }

    setIsCancelling(true);
    setError(null);

    try {
      const response = await fetch('/api/membership/cancel', {
        method: 'PUT',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cancelar la suscripción');
      }

      // Recargar la página para mostrar el estado actualizado
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error al cancelar la suscripción');
      setIsCancelling(false);
    }
  };

  return (
    <Section className='max-w-2xl'>
      <SectionHeader>
        <SectionTitle>Datos de tu membresía</SectionTitle>
      </SectionHeader>
      <section className='flex flex-col divide-y text-sm *:py-2'>
        <section className='flex flex-col gap-2 sm:flex-row sm:justify-between'>
          <p className='font-medium'>Membresía:</p>
          <div className='flex items-center'>
            <code className='text-xs sm:text-sm w-fit break-all sm:break-normal'>{membership.name}</code>
          </div>
        </section>
        <section className='flex flex-col gap-2 sm:flex-row sm:justify-between'>
          <p className='font-medium'>Estado:</p>
          <code
            className={`text-xs sm:text-sm w-fit font-semibold ${
              isExpired || isCancelled
                ? 'text-red-600 dark:text-red-400'
                : isActive
                ? 'text-green-600 dark:text-green-400'
                : 'text-yellow-600 dark:text-yellow-400'
            }`}
          >
            {isExpired || isCancelled ? 'Expirada' : status === 'active' ? 'Activa' : status}
          </code>
        </section>
        <section className='flex flex-col gap-2 sm:flex-row sm:justify-between'>
          <p className='font-medium'>Fecha inicio:</p>
          <code className='text-xs sm:text-sm w-fit break-all sm:break-normal'>{formattedStart}</code>
        </section>
        <section className='flex flex-col gap-2 sm:flex-row sm:justify-between'>
          <p className='font-medium'>Fecha finalización:</p>
          <code className='text-xs sm:text-sm w-fit break-all sm:break-normal'>{formattedEnd}</code>
        </section>
        <section className='flex flex-col gap-2 sm:flex-row sm:justify-between'>
          <p className='font-medium'>Días restantes:</p>
          <code
            className={`text-xs sm:text-sm w-fit ${
              isExpired || isCancelled
                ? 'text-red-600 dark:text-red-400 font-semibold'
                : differenceDays <= 7
                ? 'text-yellow-600 dark:text-yellow-400'
                : ''
            }`}
          >
            {isExpired || isCancelled
              ? 'Expirada'
              : differenceDays > 0
              ? `${differenceDays} días restantes`
              : differenceDays === 0
              ? 'Expira hoy'
              : `Expirada hace ${Math.abs(differenceDays)} días`}
          </code>
        </section>
      </section>

      {isActive && (
        <section className='mt-6 pt-6 border-t'>
          <div className='flex flex-col gap-4'>
            <div>
              <h3 className='font-semibold text-primary mb-2'>Cancelar membresía</h3>
              <p className='text-sm text-muted-foreground mb-4'>
                Si cancelas tu membresía, perderás acceso a todos los beneficios al finalizar el período actual.
              </p>
            </div>
            {error && (
              <div className='p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'>
                <p className='text-sm text-red-600 dark:text-red-400'>{error}</p>
              </div>
            )}
            <Button
              onClick={handleCancel}
              disabled={isCancelling}
              variant='destructive'
              className='w-full sm:w-auto'
            >
              {isCancelling ? 'Cancelando...' : 'Cancelar membresía'}
            </Button>
          </div>
        </section>
      )}
    </Section>
  );
}

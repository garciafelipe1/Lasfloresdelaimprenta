import {
  Section,
  SectionHeader,
  SectionTitle,
} from '@/app/components/common/section/section';
import { SubscriptionWithMembership } from '@/common/dto/subscription.dto';
import { differenceInCalendarDays, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  subscription: SubscriptionWithMembership;
}

export function SubInformation({ subscription }: Props) {
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
    </Section>
  );
}

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

  const differenceDays = differenceInCalendarDays(started_at, ended_at);

  return (
    <Section className='max-w-2xl'>
      <SectionHeader>
        <SectionTitle>Datos de tu membresía</SectionTitle>
      </SectionHeader>
      <section className='flex flex-col divide-y text-sm *:py-2'>
        <section className='flex justify-between gap-2'>
          <p>Membresía:</p>
          <div className='flex items-center'>
            <code className='w-fit'>{membership.name}</code>
          </div>
        </section>
        <section className='flex justify-between gap-2'>
          <p>Estado:</p>
          <code className='w-fit'>{status}</code>
        </section>
        <section className='flex justify-between gap-2'>
          <p>Fecha inicio:</p>
          <code className='w-fit'>{formattedStart}</code>
        </section>
        <section className='flex justify-between gap-2'>
          <p>Fecha finalización:</p>
          <code className='w-fit'>{formattedEnd}</code>
        </section>
        <section className='flex justify-between gap-2'>
          <p>Días restantes:</p>
          <code className='w-fit'>{differenceDays} días restantes</code>
        </section>
      </section>
    </Section>
  );
}

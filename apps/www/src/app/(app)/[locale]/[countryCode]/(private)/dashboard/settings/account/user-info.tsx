import {
  Section,
  SectionHeader,
  SectionSubtitle,
  SectionTitle,
} from '@/app/components/common/section/section';
import { CopyButton } from '@/app/components/ui/copy-button';
import { format } from 'date-fns';

interface Props {
  id: string;
  createdAt: string;
  email: string;
}

export function UserInfo({ createdAt, id, email }: Props) {
  return (
    <Section>
      <SectionHeader>
        <SectionTitle>Información general</SectionTitle>
        <SectionSubtitle>Datos</SectionSubtitle>
      </SectionHeader>
      <section className='flex flex-col divide-y text-sm *:py-2'>
        <section className='flex flex-col gap-2 sm:flex-row sm:justify-between'>
          <p className='font-medium'>ID:</p>
          <div className='flex items-center gap-2 sm:gap-1'>
            <code className='text-xs sm:text-sm break-all sm:break-normal'>{id}</code>
            <CopyButton value={id} />
          </div>
        </section>
        <section className='flex flex-col gap-2 sm:flex-row sm:justify-between'>
          <p className='font-medium'>Email:</p>
          <code className='text-xs sm:text-sm break-all sm:break-normal w-fit'>{email}</code>
        </section>
        <section className='flex flex-col gap-2 sm:flex-row sm:justify-between'>
          <p className='font-medium'>Fecha creación:</p>
          <code className='text-xs sm:text-sm w-fit'>
            {format(new Date(createdAt), 'dd-MM-yyyy')}
          </code>
        </section>
        <section className='flex flex-col gap-2 sm:flex-row sm:justify-between'>
          <p className='font-medium'>Fecha actualización perfil:</p>
          <code className='text-xs sm:text-sm w-fit'>
            {format(new Date(createdAt), 'dd-MM-yyyy')}
          </code>
        </section>
      </section>
    </Section>
  );
}

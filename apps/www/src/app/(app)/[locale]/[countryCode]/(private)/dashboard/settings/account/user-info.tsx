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
        <section className='flex justify-between gap-2'>
          <p>ID:</p>
          <div className='flex items-center'>
            <code className='w-fit'>{id}</code>
            <CopyButton value={id} />
          </div>
        </section>
        <section className='flex justify-between gap-2'>
          <p>Email:</p>
          <code className='w-fit'>{email}</code>
        </section>
        <section className='flex justify-between gap-2'>
          <p>Fecha creación:</p>
          <code className='w-fit'>
            {format(new Date(createdAt), 'dd-MM-yyyy')}
          </code>
        </section>
        <section className='flex justify-between gap-2'>
          <p>Fecha actualización perfil:</p>
          <code className='w-fit'>
            {format(new Date(createdAt), 'dd-MM-yyyy')}
          </code>
        </section>
      </section>
    </Section>
  );
}

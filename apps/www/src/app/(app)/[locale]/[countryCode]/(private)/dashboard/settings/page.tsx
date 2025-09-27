import {
  Section,
  SectionHeader,
  SectionSubtitle,
  SectionTitle,
} from '@/app/components/common/section/section';
import { Button } from '@/app/components/ui/button';
import { Preferences } from './_components/preferences';
import { SignOutButton } from './_components/sign-out-button';

export default function SettingsPage() {
  return (
    <section className='flex flex-col [&>[data-role=section]]:pb-8'>
      <header>
        <h2>Configuraciones Generales</h2>
        <p>
          Personalizá tu experiencia y ajustá las opciones según tus necesidades
        </p>
      </header>
      <Section className='max-w-2xl'>
        <SectionHeader>
          <SectionTitle>Preferencias del sistema</SectionTitle>
          <SectionSubtitle>
            Elegí cómo querés que funcione la app según tus gustos
          </SectionSubtitle>
        </SectionHeader>
        <Preferences />
      </Section>
      <Section>
        <SectionHeader>
          <SectionTitle>Acciones rápidas</SectionTitle>
        </SectionHeader>
        <section className='flex gap-4'>
          <Button variant='outline'>Cambiar contraseña</Button>
          <SignOutButton />
        </section>
      </Section>
    </section>
  );
}

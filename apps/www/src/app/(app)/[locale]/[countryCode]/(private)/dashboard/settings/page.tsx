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
      <header className='mb-6 md:mb-8'>
        <h2 className='text-2xl md:text-3xl font-bold'>Configuraciones Generales</h2>
        <p className='text-sm md:text-base text-muted-foreground mt-2'>
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
        <section className='flex flex-col gap-3 sm:flex-row sm:gap-4'>
          <Button variant='outline' className='w-full sm:w-auto'>Cambiar contraseña</Button>
          <SignOutButton />
        </section>
      </Section>
    </section>
  );
}

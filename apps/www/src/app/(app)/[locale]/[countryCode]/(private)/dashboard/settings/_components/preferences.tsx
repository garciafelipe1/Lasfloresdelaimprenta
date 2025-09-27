'use client';

import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

export function Preferences() {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = () => {
    setTheme((preTheme) => {
      return preTheme === 'dark' ? 'light' : 'dark';
    });
    toast.success('Configuración guardada');
  };

  const alertas = true;

  const handleAlertasChange = () => {};

  return (
    <section className='w-full space-y-6'>
      <div className='space-y-4'>
        <section className='flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm'>
          <div className='space-y-0.5'>
            <Label>Tema oscuro</Label>
            <p>Activá esta opción para usar la app en modo oscuro.</p>
          </div>
          <Switch
            checked={theme === 'dark'}
            onCheckedChange={handleThemeChange}
          />
        </section>
        <section className='flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm'>
          <div className='space-y-0.5'>
            <Label>Notificaciones</Label>
            <p>Recibir alertas dentro de la app sobre actividad importante.</p>
          </div>
          <Switch
            checked={alertas}
            onCheckedChange={handleAlertasChange}
          />
        </section>
      </div>
    </section>
  );
}

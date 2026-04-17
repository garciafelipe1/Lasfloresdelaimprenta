'use client';

import { completeWelcomeProfileAction } from '@/app/actions/welcome/complete-welcome-profile.action';
import { Button } from '@/app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  welcomeProfileSchema,
  type WelcomeProfileInput,
} from '@/lib/zod/welcome-profile-schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';

const FLOWER_LABELS: Record<
  WelcomeProfileInput['flower_preference'],
  string
> = {
  rosas: 'Ramos de rosas',
  mix_estacional: 'Mix / estacional',
  plantas: 'Plantas',
  eventos: 'Eventos / decoración',
  otro: 'Otro',
};

const GENDER_LABELS: Record<WelcomeProfileInput['gender'], string> = {
  femenino: 'Femenino',
  masculino: 'Masculino',
  otro: 'Otro',
  prefiero_no_decir: 'Prefiero no decir',
};

const FLOWER_VALUES = [
  'rosas',
  'mix_estacional',
  'plantas',
  'eventos',
  'otro',
] as const satisfies readonly WelcomeProfileInput['flower_preference'][];

const GENDER_VALUES = [
  'femenino',
  'masculino',
  'otro',
  'prefiero_no_decir',
] as const satisfies readonly WelcomeProfileInput['gender'][];

type Props = {
  open: boolean;
};

/**
 * Obligatorio tras el primer registro: datos de contacto y preferencias.
 * Al enviar, el backend crea un cupón Medusa único (7 días, un uso) y se aplica al carrito si hay ítems.
 */
export function WelcomeProfileDialog({ open }: Props) {
  const router = useRouter();

  const form = useForm<WelcomeProfileInput>({
    resolver: zodResolver(welcomeProfileSchema),
    defaultValues: {
      phone: '',
      instagram: '',
      flower_preference: 'mix_estacional',
      age: 25,
      gender: 'prefiero_no_decir',
    },
  });

  const { execute, isExecuting } = useAction(completeWelcomeProfileAction, {
    onSuccess: () => {
      router.refresh();
    },
    onError: ({ error }) => {
      const msg =
        error.serverError ??
        'No se pudo guardar. Revisá los datos e intentá de nuevo.';
      form.setError('root', { message: String(msg) });
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    form.clearErrors('root');
    execute(values);
  });

  return (
    <Dialog open={open}>
      <DialogContent
        className='sm:max-w-lg max-h-[90vh] overflow-y-auto'
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className='text-primary text-xl'>
            Completá tu perfil
          </DialogTitle>
          <DialogDescription className='text-base'>
            Necesitamos estos datos para tu cupón del 10% en la primera compra
            (válido 7 días una vez enviado el formulario).
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={onSubmit}
          className='space-y-4 pt-2'
        >
          <div className='space-y-2'>
            <Label htmlFor='welcome-phone'>Teléfono</Label>
            <Input
              id='welcome-phone'
              type='tel'
              autoComplete='tel'
              placeholder='Ej. 1122334455'
              {...form.register('phone')}
            />
            {form.formState.errors.phone ? (
              <p className='text-sm text-destructive'>
                {form.formState.errors.phone.message}
              </p>
            ) : null}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='welcome-instagram'>Usuario de Instagram</Label>
            <Input
              id='welcome-instagram'
              autoComplete='off'
              placeholder='sin @'
              {...form.register('instagram')}
            />
            {form.formState.errors.instagram ? (
              <p className='text-sm text-destructive'>
                {form.formState.errors.instagram.message}
              </p>
            ) : null}
          </div>

          <div className='space-y-2'>
            <Label>Preferencia de flores</Label>
            <Controller
              control={form.control}
              name='flower_preference'
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Elegí una opción' />
                  </SelectTrigger>
                  <SelectContent>
                    {FLOWER_VALUES.map((v) => (
                      <SelectItem
                        key={v}
                        value={v}
                      >
                        {FLOWER_LABELS[v]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.flower_preference ? (
              <p className='text-sm text-destructive'>
                {form.formState.errors.flower_preference.message}
              </p>
            ) : null}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='welcome-age'>Edad</Label>
            <Input
              id='welcome-age'
              type='number'
              min={18}
              max={120}
              {...form.register('age', { valueAsNumber: true })}
            />
            {form.formState.errors.age ? (
              <p className='text-sm text-destructive'>
                {form.formState.errors.age.message}
              </p>
            ) : null}
          </div>

          <div className='space-y-2'>
            <Label>Género</Label>
            <Controller
              control={form.control}
              name='gender'
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Elegí una opción' />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_VALUES.map((v) => (
                      <SelectItem
                        key={v}
                        value={v}
                      >
                        {GENDER_LABELS[v]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.gender ? (
              <p className='text-sm text-destructive'>
                {form.formState.errors.gender.message}
              </p>
            ) : null}
          </div>

          {form.formState.errors.root ? (
            <p className='text-sm text-destructive'>
              {form.formState.errors.root.message}
            </p>
          ) : null}

          <Button
            type='submit'
            className='w-full'
            size='lg'
            disabled={isExecuting}
          >
            {isExecuting ? 'Guardando…' : 'Guardar y activar mi cupón'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

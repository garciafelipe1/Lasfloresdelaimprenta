'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { attachReferralCodeAction } from '@/app/actions/referral/attach-referral-code.action';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/components/ui/form';
import { Input } from '@/app/components/ui/input';
import { FormButton } from '@/app/components/ui/form-button';

const schema = z.object({
  code: z.string().min(3, 'Ingresá un código válido').max(64),
});

type Values = z.infer<typeof schema>;

export function ReferralCodeCard(props: {
  defaultCode?: string;
  alreadyAttached?: boolean;
  variant?: 'default' | 'compact';
}) {
  const router = useRouter();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { code: props.defaultCode ?? '' },
  });

  const attach = useAction(attachReferralCodeAction, {
    onSuccess({ data }) {
      if (!data?.ok) return;
      if (data.alreadyAttached) {
        toast.message('Tu cuenta ya tenía un referido asociado.');
        router.refresh();
        return;
      }
      toast.success('Código aplicado. Ya tenés tu beneficio activado.');
      form.reset({ code: '' });
      router.refresh();
    },
    onError({ error }) {
      toast.error(error.serverError || 'No se pudo aplicar el código.');
    },
  });

  const disabled = props.alreadyAttached === true;
  const compact = props.variant === 'compact';

  return (
    <div
      className={
        compact
          ? 'rounded-2xl border border-border bg-secondary/30 p-4'
          : 'rounded-2xl border border-border bg-secondary/30 p-4 md:p-5'
      }
    >
      <div className="flex flex-col gap-1">
        <p className={compact ? 'text-primary text-base font-semibold' : 'text-primary text-lg font-semibold'}>
          ¿Te pasaron un código de referido?
        </p>
        <p className="text-muted-foreground text-sm">
          {disabled ? (
            <>Tu cuenta ya tiene un referido asociado.</>
          ) : (
            <>
              Pegalo acá y presioná <span className="font-semibold">Aplicar</span>.
            </>
          )}
        </p>
      </div>

      <Form {...form}>
        <form
          className="mt-4 grid gap-3"
          onSubmit={form.handleSubmit((values) => attach.execute(values))}
        >
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código de referido</FormLabel>
                <FormControl>
                  <Input
                    placeholder="RF-XXXXXXX"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-primary/70 text-xs">
              Solo se puede asociar <span className="font-semibold">una vez</span> por cuenta.
            </p>
            <FormButton
              type="submit"
              disabled={disabled}
              isLoading={attach.status === 'executing'}
              className="w-full sm:w-auto"
            >
              Aplicar
            </FormButton>
          </div>
        </form>
      </Form>
    </div>
  );
}


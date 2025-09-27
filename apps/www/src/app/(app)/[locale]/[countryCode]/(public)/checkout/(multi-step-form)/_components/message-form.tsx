import { upateItemMessageAction } from '@/app/actions/cart/update-item-message.action';
import { FormButton } from '@/app/components/ui/form-button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { updateItemMessageSchema } from '@/lib/zod/update-item-message-schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'next-safe-action/hooks';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

interface Props {
  message?: string;
  itemId: string;
  quantity: number;
  onClose: () => void;
}

const formSchema = updateItemMessageSchema.pick({
  message: true,
});

type FormSchema = z.infer<typeof formSchema>;

export function MessageForm({ message, itemId, quantity, onClose }: Props) {
  const { execute, isPending } = useAction(upateItemMessageAction, {
    onSuccess() {
      onClose();
    },
  });

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message,
    },
  });

  function onSubmit(values: FormSchema) {
    execute({
      itemId,
      message: values.message,
      quantity,
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='flex w-full flex-col gap-4'
      >
        <FormField
          control={form.control}
          name='message'
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder='Para alguien muy especial...'
                  type='text'
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Escribí un mensaje para la tarjeta
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormButton
          isLoading={isPending}
          disabled={isPending}
        >
          Continuar
        </FormButton>
      </form>
    </Form>
  );
}

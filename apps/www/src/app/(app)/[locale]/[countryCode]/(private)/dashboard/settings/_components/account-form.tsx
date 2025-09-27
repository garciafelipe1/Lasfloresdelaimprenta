'use client';

import { updateUserAction } from '@/app/actions/update-user.action';
import { Button } from '@/app/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/components/ui/form';
import { Input } from '@/app/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'next-safe-action/hooks';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

type Props = {
  name: string;
  image: string | null;
};

export const updateUserSchema = z.object({
  name: z.string(),
});

export type UpdateUserSchema = z.infer<typeof updateUserSchema>;

export default function AccountForm({ name }: Props) {
  // const [files, setFiles] = useState<File[] | null>(null);
  const { execute } = useAction(updateUserAction, {
    onSuccess: () => {
      toast.success('Usuario actualizado correctamente');
    },
    onError: (error) => {
      console.error('Error updating user', error);
      toast.error('Hubo un error al actualizar el usuario');
    },
  });

  const handleSubmit = (data: UpdateUserSchema) => {
    // if (files && files.length > 0) {
    //   data.image = files[0];
    // }
    execute(data);
  };

  // const dropZoneConfig = {
  //   maxFiles: 1,
  //   maxSize: 1024 * 1024 * 4,
  //   multiple: false,
  // };

  const form = useForm<UpdateUserSchema>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name,
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className='w-full max-w-3xl space-y-8 py-10'
      >
        {/* <FormField
          control={form.control}
          name='image'
          render={({}) => (
            <FormItem>
              <FormLabel>Foto de perfil</FormLabel>
              <FormControl>
                <FileUploader
                  value={files}
                  onValueChange={setFiles}
                  dropzoneOptions={dropZoneConfig}
                  className='bg-background relative rounded-lg p-2'
                >
                  <FileInput id='fileInput'>
                    <div className='bg-secondary relative mx-auto flex aspect-square w-1/2 flex-col items-center justify-center rounded-full p-4 outline-slate-500 outline-dashed'>
                      {image && (
                        <Image
                          fill
                          src={image}
                          alt='Preview'
                          className='h-full w-full rounded-full object-cover'
                        />
                      )}
                      {files && files.length > 0 ? (
                        <Image
                          fill
                          src={URL.createObjectURL(files[0])}
                          alt='Preview'
                          className='h-full w-full rounded-full object-cover'
                        />
                      ) : null}
                      <CloudUpload className='h-8 w-8 text-gray-500' />
                      <p className='text-center text-xs text-gray-500 dark:text-gray-400'>
                        Formatos permitidos: SVG, PNG, JPG o GIF
                      </p>
                    </div>
                  </FileInput>
                  <FileUploaderContent>
                    {files &&
                      files.length > 0 &&
                      files.map((file, i) => (
                        <FileUploaderItem
                          key={i}
                          index={i}
                        >
                          <Paperclip className='h-4 w-4 stroke-current' />
                          <span>{file.name}</span>
                        </FileUploaderItem>
                      ))}
                  </FileUploaderContent>
                </FileUploader>
              </FormControl>
              <FormDescription>
                Seleccioná un archivo para subir.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        /> */}

        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre completo</FormLabel>
              <FormControl>
                <Input
                  placeholder='Juan Pérez'
                  type='text'
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Este es tu nombre completo real.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit'>Guardar</Button>
      </form>
    </Form>
  );
}

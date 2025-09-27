'use client';

import { loginAction } from '@/app/actions/user/login.action';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/components/ui/form';
import { FormButton } from '@/app/components/ui/form-button';
import { Input } from '@/app/components/ui/input';
import { PasswordInput } from '@/app/components/ui/password-input';
import { LoginSchemaType, loginSchema } from '@/lib/zod/login-schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { GoogleFooter } from '../google-footer';

export default function LoginPreview() {
  const i18n = useTranslations('Auth.login');
  const { execute, isPending } = useAction(loginAction);
  const form = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  return (
    <div className='flex h-full min-h-[50vh] w-full flex-col items-center justify-center px-4'>
      <Card className='mx-auto w-full max-w-md'>
        <CardHeader>
          <CardTitle className='text-2xl'>{i18n('title')}</CardTitle>
          <CardDescription>{i18n('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(execute)}
              className='space-y-8'
            >
              <div className='grid gap-4'>
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem className='grid gap-2'>
                      <FormLabel htmlFor='email'>{i18n('email')}</FormLabel>
                      <FormControl>
                        <Input
                          id='email'
                          placeholder='johndoe@mail.com'
                          type='email'
                          autoComplete='email'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem className='grid gap-2'>
                      <div className='flex items-center justify-between'>
                        <FormLabel htmlFor='password'>
                          {i18n('password')}
                        </FormLabel>
                        <Link
                          href='#'
                          className='ml-auto inline-block text-sm underline'
                        >
                          {i18n('forgotPassword')}
                        </Link>
                      </div>
                      <FormControl>
                        <PasswordInput
                          id='password'
                          placeholder='******'
                          autoComplete='current-password'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormButton
                  isLoading={isPending}
                  disabled={isPending}
                  type='submit'
                  className='w-full'
                >
                  {i18n('submit')}
                </FormButton>
                <GoogleFooter />
              </div>
            </form>
          </Form>
          <div className='mt-4 text-center text-sm'>
            {i18n('noAccount')}
            <Link
              href='/register'
              className='underline'
            >
              {i18n('registerLink')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

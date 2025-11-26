'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'next-safe-action/hooks';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { registerAction } from '@/app/actions/user/register.action';
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
import { PhoneInput } from '@/app/components/ui/phone-input';
import { registerSchema } from '@/lib/zod/register-schema';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; // ✅ Import correcto

export default function RegisterPreview() {
  const i18n = useTranslations('Auth.register');
  const router = useRouter();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const { execute, isExecuting } = useAction(registerAction, {
    onSuccess() {
      router.push('/login');
      toast.success('Cuenta creada!');
    },
    onError({ error }) {
      toast.error(error.serverError ?? '');
    },
  });

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    execute(values);
  }

  return (
    <div className="flex h-full min-h-[60vh] w-full items-center justify-center px-4">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{i18n('title')}</CardTitle>
          <CardDescription>{i18n('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8"
            >
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormLabel htmlFor="name">{i18n('name')}</FormLabel>
                      <FormControl>
                        <Input
                          id="name"
                          placeholder="Juan Pérez"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormLabel htmlFor="email">{i18n('email')}</FormLabel>
                      <FormControl>
                        <Input
                          id="email"
                          placeholder="juanperez@mail.com"
                          type="email"
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormLabel htmlFor="phone">{i18n('phone')}</FormLabel>
                      <FormControl>
                        <PhoneInput
                          {...field}
                          defaultCountry="AR"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormLabel htmlFor="password">
                        {i18n('password')}
                      </FormLabel>
                      <FormControl>
                        <PasswordInput
                          id="password"
                          placeholder="******"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormLabel htmlFor="confirmPassword">
                        {i18n('confirmPassword')}
                      </FormLabel>
                      <FormControl>
                        <PasswordInput
                          id="confirmPassword"
                          placeholder="******"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormButton
                  isLoading={isExecuting}
                  disabled={isExecuting}
                  type="submit"
                  className="w-full"
                >
                  {i18n('submit')}
                </FormButton>

                {/* Botón de Google directo al proxy /api/auth/google */}
                <button
                  type="button"
                  onClick={() => (window.location.href = '/api/auth/google')}
                  className="flex w-full items-center justify-center rounded-md bg-black px-4 py-2 text-white hover:bg-neutral-800 transition"
                >
                  <Image
                    src="/google.svg"
                    alt="Google"
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                  Iniciar sesión con Google
                </button>
              </div>
            </form>
          </Form>

          <div className="mt-4 text-center text-sm">
            {i18n('haveAccount')}{' '}
            <Link
              href="/login"
              className="underline"
            >
              {i18n('loginLink')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

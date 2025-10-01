'use client';

import { loginAction } from '@/app/actions/user/login.action';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { useTranslations } from 'next-intl';
import { GoogleFooter } from '../google-footer';

export default function LoginPreview() {
  const i18n = useTranslations('Auth.login');

  return (
    <div className='flex h-full min-h-[50vh] w-full flex-col items-center justify-center px-4'>
      <Card className='mx-auto w-full max-w-md'>
        <CardHeader>
          <CardTitle className='text-2xl'>{i18n('title')}</CardTitle>
          <CardDescription>{i18n('description')}</CardDescription>
          console.log(loginAction);
        </CardHeader>
        <CardContent>
          {/* Solo mostramos GoogleFooter */}
          <div className='grid gap-4'>
            <GoogleFooter />
          </div>

          <div className='mt-4 text-center text-sm'>
            {i18n('noAccount')}{' '}
            <a
              href='/register'
              className='underline'
            >
              {i18n('registerLink')}
            </a>
          </div>
        </CardContent>

      </Card>
    </div>
  );
}

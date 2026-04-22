import {
  Section,
  SectionHeader,
  SectionSubtitle,
  SectionTitle,
} from '@/app/components/common/section/section';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import AccountForm from '../_components/account-form';
import { UserInfo } from './user-info';
import { redirect } from 'next/navigation';
import { ReferralCodeCard } from '@/app/components/referral/referral-code-card';

const REFERRAL_OWN_CODE_KEY = 'referral_own_code' as const;
const REFERRAL_REFERRER_CUSTOMER_ID_KEY = 'referral_referrer_customer_id' as const;

type Props = {
  params: Promise<{ locale: string; countryCode: string }>;
};

export default async function AccountSettingsPage({ params }: Props) {
  const { locale, countryCode } = await params;
  const user = await authService.getUser();
  const { referral } = await userService.getSubscriptionInfo();

  if (!user) {
    redirect(`/${locale}/${countryCode}/login?error=session_invalid`);
  }

  const { created_at, first_name, email, id } = user;
  const meta =
    user.metadata && typeof user.metadata === 'object' && !Array.isArray(user.metadata)
      ? (user.metadata as Record<string, unknown>)
      : {};
  const ownCode =
    typeof meta[REFERRAL_OWN_CODE_KEY] === 'string' ? (meta[REFERRAL_OWN_CODE_KEY] as string) : '';
  const hasReferrer =
    typeof meta[REFERRAL_REFERRER_CUSTOMER_ID_KEY] === 'string' &&
    Boolean((meta[REFERRAL_REFERRER_CUSTOMER_ID_KEY] as string).trim());

  return (
    <section className=''>
      <header className='mb-6 md:mb-8'>
        <h2 className='text-2xl md:text-3xl font-bold'>Configuraciones de la cuenta</h2>
        <p className='text-sm md:text-base text-muted-foreground mt-2'>Modifica las configuraciones de tu cuenta</p>
      </header>
      <section className='grid grid-cols-1 lg:grid-cols-[repeat(auto-fit,minmax(min(100%,400px),1fr))] gap-6 lg:gap-0 lg:divide-x [&>[data-role=section]:first-child]:lg:pr-4 [&>[data-role=section]:last-child]:lg:pl-4'>
        <Section>
          <SectionHeader>
            <SectionTitle>Datos de tu cuenta</SectionTitle>
            <SectionSubtitle>Modificalos a tu gusto</SectionSubtitle>
          </SectionHeader>
          <AccountForm
            image={''}
            name={first_name!}
          />
        </Section>
        <Section id="referrals">
          <SectionHeader>
            <SectionTitle>Referidos</SectionTitle>
            <SectionSubtitle>
              Si te pasaron un código, aplicalo acá.
            </SectionSubtitle>
          </SectionHeader>
          {hasReferrer ? (
            <div className="rounded-2xl border border-border bg-background/20 p-4">
              <p className="text-primary text-sm font-semibold">Estado</p>
              <p className="text-primary mt-1 text-sm">
                Ya tenés un referido asociado a tu cuenta.
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Si creés que es un error, escribinos y lo revisamos.
              </p>
            </div>
          ) : null}
          <ReferralCodeCard defaultCode={''} alreadyAttached={hasReferrer} />
          {ownCode ? (
            <div className="rounded-2xl border border-border bg-background/20 p-4">
              <p className="text-primary text-sm font-semibold">Tu código</p>
              <p className="text-primary mt-1 font-mono text-lg font-bold tracking-wide">{ownCode}</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Compartilo para que otras personas se registren con tu código.
              </p>
            </div>
          ) : null}

          {referral && referral.ownCode ? (
            <div className="rounded-2xl border border-border bg-background/20 p-4">
              <p className="text-primary text-sm font-semibold">Actividad</p>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-background/30 px-3 py-2">
                  <p className="text-primary text-xs font-semibold uppercase tracking-wide opacity-80">
                    Registrados con tu código
                  </p>
                  <p className="text-primary mt-1 text-base font-semibold">
                    {typeof referral.referredTotal === 'number' ? referral.referredTotal : '—'}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-background/30 px-3 py-2">
                  <p className="text-primary text-xs font-semibold uppercase tracking-wide opacity-80">
                    Recompensas este mes
                  </p>
                  <p className="text-primary mt-1 text-base font-semibold">
                    {typeof referral.rewardsGrantedThisMonth === 'number'
                      ? referral.rewardsGrantedThisMonth
                      : '—'}
                  </p>
                </div>
              </div>

              {Array.isArray(referral.recentReferees) && referral.recentReferees.length > 0 ? (
                <div className="mt-3">
                  <p className="text-primary mb-2 text-xs font-semibold uppercase tracking-wide opacity-80">
                    Últimos referidos
                  </p>
                  <ul className="space-y-1">
                    {referral.recentReferees.slice(0, 5).map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-primary truncate">
                          {r.email ? r.email : `Customer ${r.id.slice(0, 8)}…`}
                        </span>
                        {r.createdAt ? (
                          <span className="text-muted-foreground whitespace-nowrap">
                            {new Date(r.createdAt).toLocaleDateString(locale, {
                              year: 'numeric',
                              month: 'short',
                              day: '2-digit',
                            })}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="pt-2">
            <UserInfo
              createdAt={created_at as string}
              email={email}
              id={id}
            />
          </div>
        </Section>
      </section>
    </section>
  );
}

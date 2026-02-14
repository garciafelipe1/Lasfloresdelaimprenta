import { notFound } from 'next/navigation';

const VALID_MEMBERSHIP_IDS = ['esencial', 'premium', 'elite'] as const;

export default async function MembershipPortfolioLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ membershipId: string }>;
}) {
  const { membershipId } = await params;
  if (!membershipId || !(VALID_MEMBERSHIP_IDS as readonly string[]).includes(membershipId)) {
    notFound();
  }
  return <>{children}</>;
}


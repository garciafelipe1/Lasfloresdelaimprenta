import type { MembershipId } from '@server/constants';

const ELITE_PORTFOLIO_V = '20260205';

// Esencial: mix de ramos + velas (mismo criterio que portfolio)
const candleGallery: string[] = [
  'https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/vela%20SILVER%20JACK%20-%20escencial.jpeg',
];

const esencialBouquet: string[] = [
  '/assets/img/memberships/carousel/carousel-1.png',
  '/assets/img/memberships/carousel/carousel-2.png',
  'https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/IMG_5689.jpg',
];

const premiumGallery: string[] = [
  '/assets/img/memberships/premium/premium-2.png',
  'https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/vela-%20DONNA%20-%20premium.jpeg',
  '/assets/img/memberships/premium/premium-6.png',
  'https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/Sprays.jpeg',
  '/assets/img/memberships/premium/premium-3.png',
];

const eliteGallery: string[] = [
  'https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/IMG_5523.jpg',
  'https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/Sprays.jpeg',
  'https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/difusores.jpeg',
  `/assets/img/memberships/elite/portfolio/elite-07.jpg?v=${ELITE_PORTFOLIO_V}`,
  'https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/49cff137-096c-47b8-8a72-46c690da0c92.jpg',
  `/assets/img/memberships/elite/portfolio/elite-05.jpg?v=${ELITE_PORTFOLIO_V}`,
];

function buildEsencialGallery(): string[] {
  const bouquet = esencialBouquet.filter(Boolean);
  const candles = candleGallery.filter(Boolean);

  const interleaved: string[] = [];
  if (bouquet[0]) interleaved.push(bouquet[0]);
  if (candles[0]) interleaved.push(candles[0]);
  if (bouquet[1]) interleaved.push(bouquet[1]);
  if (bouquet[2]) interleaved.push(bouquet[2]);

  return [...new Set(interleaved)];
}

export function getExclusiveGalleryImagesForMembership(
  membershipId: string | null | undefined,
  limit = 6,
): string[] {
  const id = (membershipId ?? '') as MembershipId | '';

  const images =
    id === 'esencial'
      ? buildEsencialGallery()
      : id === 'premium'
        ? premiumGallery
        : id === 'elite'
          ? eliteGallery
          : [];

  const cleaned = images.filter((s) => typeof s === 'string' && s.trim());
  return cleaned.slice(0, Math.max(0, limit));
}


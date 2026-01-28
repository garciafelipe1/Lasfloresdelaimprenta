import { StoreRegion } from '@medusajs/types';
import { medusa } from '../medusa-client';

const regionMap = new Map<string, StoreRegion>();

export const getRegion = async (countryCode: string) => {
  try {
    if (regionMap.has(countryCode)) {
      return regionMap.get(countryCode);
    }

    const regions = await listRegions();

    if (!regions) {
      return null;
    }

    regions.forEach((region) => {
      region.countries?.forEach((country) => {
        regionMap.set(country?.iso_2 ?? '', region);
      });
    });

    const region = countryCode
      ? regionMap.get(countryCode)
      : regionMap.get('ar');

    return region;
  } catch (e: unknown) {
    // Evitar "Error: [Server] {}" en overlay (Next muestra console.error en RSC)
    const message = e instanceof Error ? e.message : String(e);
    console.warn('[getRegion] Failed to fetch regions:', message);
    return null;
  }
};

export const listRegions = async () => {
  try {
    const { regions } = await medusa.store.region.list();
    return regions;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.warn('[listRegions] fetch failed:', message);
    return null;
  }
};

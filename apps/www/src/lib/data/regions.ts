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
    console.error({ e });
    return null;
  }
};

export const listRegions = async () => {
  const { regions } = await medusa.store.region.list();
  return regions;
};

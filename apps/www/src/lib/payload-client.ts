import config from '@payload-config';
import { BasePayload, getPayload } from 'payload';

let cachedPayload: BasePayload | null = null;

export async function getPayloadClient() {
  if (!cachedPayload) {
    cachedPayload = await getPayload({ config });
  }
  return cachedPayload;
}

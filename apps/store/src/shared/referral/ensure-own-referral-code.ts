import { differenceInCalendarDays } from "date-fns";
import { findReferrerCustomerIdByOwnCode } from "./find-referrer-by-code";
import { generateReferralOwnCode } from "./generate-referral-code";
import {
  REFERRAL_ELIGIBLE_SINCE_KEY,
  REFERRAL_OWN_CODE_KEY,
} from "./metadata-keys";

type CustomerModuleLike = {
  retrieveCustomer: (id: string) => Promise<{ metadata?: unknown }>;
  updateCustomers: (
    id: string,
    data: { metadata?: Record<string, unknown> },
  ) => Promise<unknown>;
  listCustomers: (
    filters?: Record<string, unknown>,
    config?: { skip?: number; take?: number },
  ) => Promise<{ id?: string; metadata?: unknown }[]>;
};

const MIN_DAYS = 30;
const MAX_UNIQUE_ATTEMPTS = 12;

async function pickUniqueOwnCode(
  customerModule: CustomerModuleLike,
  customerId: string,
  logger: { warn: (m: string) => void },
): Promise<string | null> {
  let code = generateReferralOwnCode();
  for (let u = 0; u < MAX_UNIQUE_ATTEMPTS; u++) {
    try {
      const owner = await findReferrerCustomerIdByOwnCode(customerModule, code);
      if (owner && owner !== customerId) {
        code = generateReferralOwnCode();
        continue;
      }
      if (owner === customerId) {
        code = generateReferralOwnCode();
        continue;
      }
      return code;
    } catch (e) {
      logger.warn(`[referral] comprobar unicidad RF: ${e}`);
      code = generateReferralOwnCode();
    }
  }
  return null;
}

/**
 * Tras MIN_Días desde la primera membresía, asigna un código único RF-… en metadata.
 */
export async function ensureOwnReferralCode(params: {
  customerId: string;
  customerModule: CustomerModuleLike;
  earliestMembershipStartedAt: Date;
  logger: { warn: (m: string) => void };
}): Promise<void> {
  const { customerId, customerModule, earliestMembershipStartedAt, logger } =
    params;

  const now = new Date();
  if (differenceInCalendarDays(now, earliestMembershipStartedAt) < MIN_DAYS) {
    return;
  }

  let customer: { metadata?: unknown };
  try {
    customer = await customerModule.retrieveCustomer(customerId);
  } catch (e) {
    logger.warn(`[referral] retrieveCustomer: ${e}`);
    return;
  }

  const meta =
    customer?.metadata && typeof customer.metadata === "object" && !Array.isArray(customer.metadata)
      ? (customer.metadata as Record<string, unknown>)
      : {};

  if (typeof meta[REFERRAL_OWN_CODE_KEY] === "string" && meta[REFERRAL_OWN_CODE_KEY].trim()) {
    return;
  }

  let attempts = 0;
  while (attempts < 5) {
    const code = await pickUniqueOwnCode(customerModule, customerId, logger);
    if (!code) {
      logger.warn("[referral] no se obtuvo código RF libre tras varios intentos");
      return;
    }
    try {
      await customerModule.updateCustomers(customerId, {
        metadata: {
          ...meta,
          [REFERRAL_OWN_CODE_KEY]: code,
          [REFERRAL_ELIGIBLE_SINCE_KEY]: earliestMembershipStartedAt.toISOString(),
        },
      });
      return;
    } catch (e) {
      logger.warn(`[referral] guardar código propio intento ${attempts + 1}: ${e}`);
      attempts += 1;
    }
  }
}

import { REFERRAL_OWN_CODE_KEY } from "./metadata-keys";
import { normalizeReferralCode } from "./generate-referral-code";

type CustomerRow = { id?: string; metadata?: unknown };

type CustomerModuleList = {
  listCustomers: (
    filters?: Record<string, unknown>,
    config?: { skip?: number; take?: number },
  ) => Promise<CustomerRow[]>;
};

/**
 * Búsqueda por metadata (O(n) por lotes). Para volúmenes grandes conviene índice/DB dedicada.
 */
export async function findReferrerCustomerIdByOwnCode(
  customerModule: CustomerModuleList,
  rawCode: string,
): Promise<string | undefined> {
  const needle = normalizeReferralCode(rawCode);
  if (!needle.startsWith("RF-")) {
    return undefined;
  }

  const take = 250;
  let skip = 0;
  for (;;) {
    const batch = await customerModule.listCustomers({}, { skip, take });
    if (!batch?.length) {
      return undefined;
    }
    for (const c of batch) {
      const m =
        c.metadata && typeof c.metadata === "object" && !Array.isArray(c.metadata)
          ? (c.metadata as Record<string, unknown>)
          : undefined;
      const v = m?.[REFERRAL_OWN_CODE_KEY];
      if (typeof v === "string" && normalizeReferralCode(v) === needle && c.id) {
        return c.id;
      }
    }
    if (batch.length < take) {
      return undefined;
    }
    skip += take;
  }
}

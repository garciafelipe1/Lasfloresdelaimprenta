import { REFERRAL_REFERRER_CUSTOMER_ID_KEY } from "./metadata-keys";

type CustomerRow = {
  id?: string;
  email?: string;
  created_at?: string | Date;
  metadata?: unknown;
};

type CustomerModuleList = {
  listCustomers: (
    filters?: Record<string, unknown>,
    config?: { skip?: number; take?: number },
  ) => Promise<CustomerRow[]>;
};

export type RefereeSummary = {
  id: string;
  email: string | null;
  createdAt: string | null;
};

function toIsoMaybe(v: unknown): string | null {
  if (v instanceof Date) {
    return Number.isNaN(v.getTime()) ? null : v.toISOString();
  }
  if (typeof v === "string") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

/**
 * Lista (por lotes) customers cuyo metadata apunta al referrerId.
 * O(n) en cantidad de customers. Para volúmenes grandes conviene índice/DB dedicada.
 */
export async function listRefereesByReferrerCustomerId(params: {
  customerModule: CustomerModuleList;
  referrerId: string;
  limit?: number;
}): Promise<{ total: number; recent: RefereeSummary[] }> {
  const { customerModule, referrerId, limit = 8 } = params;

  const take = 250;
  let skip = 0;
  let total = 0;
  const recent: RefereeSummary[] = [];

  for (;;) {
    const batch = await customerModule.listCustomers({}, { skip, take });
    if (!batch?.length) break;

    for (const c of batch) {
      const m =
        c.metadata && typeof c.metadata === "object" && !Array.isArray(c.metadata)
          ? (c.metadata as Record<string, unknown>)
          : undefined;
      const v = m?.[REFERRAL_REFERRER_CUSTOMER_ID_KEY];
      if (typeof v === "string" && v === referrerId && c.id) {
        total += 1;
        if (recent.length < limit) {
          recent.push({
            id: c.id,
            email: typeof c.email === "string" ? c.email : null,
            createdAt: toIsoMaybe(c.created_at),
          });
        }
      }
    }

    if (batch.length < take) break;
    skip += take;
  }

  // Ordenar recents por createdAt desc cuando exista
  recent.sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    return tb - ta;
  });

  return { total, recent };
}


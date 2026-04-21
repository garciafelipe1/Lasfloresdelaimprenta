import { z } from "zod";
import { normalizeReferralCode } from "../../../../shared/referral/generate-referral-code";

export const attachReferralSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(32)
    .transform((s) => normalizeReferralCode(s)),
});

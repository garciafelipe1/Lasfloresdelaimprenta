import { z } from "zod";

export const innerCircleAdminPutSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("auto") }),
  z.object({
    mode: z.literal("manual"),
    tier: z.enum(["solido", "senior", "vip"]),
    notes: z.string().max(2000).optional(),
  }),
]);

export type InnerCircleAdminPutBody = z.infer<typeof innerCircleAdminPutSchema>;

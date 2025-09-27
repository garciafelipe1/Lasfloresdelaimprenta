import z from "zod";

export const externalReferenceSchema = z.object({
  userId: z.string(),
  membershipId: z.string(),
});

export type ExternalReference = z.infer<typeof externalReferenceSchema>;

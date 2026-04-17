import { z } from "zod";

export const flowerPreferenceEnum = z.enum([
  "rosas",
  "mix_estacional",
  "plantas",
  "eventos",
  "otro",
]);

export const genderEnum = z.enum([
  "femenino",
  "masculino",
  "otro",
  "prefiero_no_decir",
]);

const instagramSchema = z
  .string()
  .min(1)
  .max(64)
  .transform((s) => s.trim().replace(/^@+/, ""))
  .refine(
    (s) => /^[a-zA-Z0-9._]+$/.test(s),
    "Instagram inválido",
  );

const phoneSchema = z
  .string()
  .min(1)
  .max(32)
  .transform((s) => s.replace(/\s/g, ""))
  .refine((s) => /^\+?[0-9]{8,15}$/.test(s), "Teléfono inválido");

export const completeWelcomeProfileSchema = z.object({
  phone: phoneSchema,
  instagram: instagramSchema,
  flower_preference: flowerPreferenceEnum,
  age: z.coerce.number().int().min(18).max(120),
  gender: genderEnum,
});

export type CompleteWelcomeProfileBody = z.infer<
  typeof completeWelcomeProfileSchema
>;

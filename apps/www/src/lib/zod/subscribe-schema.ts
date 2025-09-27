// Los schemas estan definidos del lado del servido, luego se pueden
// usar en client components/hooks
// Anteriormente teniamos un bug porque el membership schema estaba
// definido adentro de un hook

import { z } from 'zod';

export const membershipSchema = z.enum(["esencial", "premium", "elite"]);

export type Membership = z.infer<typeof membershipSchema>;

export const membershipParser = z.object({
  membership: membershipSchema,
});

export const subscribeSchema = z.object({
  email: z
    .string({ message: 'Este campo no puede estár vacio' })
    .min(1, 'Este campo no puede estár vacio')
    .email('Ingresa un email válido'),
});

export type SubscribeSchema = z.infer<typeof subscribeSchema>;

export const subscribeSchemaAction = subscribeSchema.extend({
  membership: membershipSchema,
});

export type SubscribeSchemaAction = z.infer<typeof subscribeSchemaAction>;

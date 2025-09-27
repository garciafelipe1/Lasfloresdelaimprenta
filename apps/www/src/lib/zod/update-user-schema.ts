import { z } from 'zod';

// const FILE_SIZE_LIMIT = 1024 * 1024 * 5;

// const file = z.preprocess(
//   (value) => (Array.isArray(value) ? value : [value]),
//   z
//     .array(z.instanceof(File))
//     .transform((files) => files[0])
//     .refine(
//       (file) => file.size <= FILE_SIZE_LIMIT,
//       'File size must be less than 1MB',
//     ),
// );

export const IMAGE_SCHEMA = z
  .instanceof(File)
  .refine(
    (file) =>
      [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/svg+xml',
        'image/gif',
      ].includes(file.type),
    'Formato de imagen no válido',
  )
  .refine(
    (file) => file.size <= 1024 * 1024 * 5,
    'La imagen debe pesar menos de 5MB',
  );

export const updateUserSchema = z.object({
  // image: IMAGE_SCHEMA.optional(),
  name: z.string(),
});

export type UpdateUserSchema = z.infer<typeof updateUserSchema>;

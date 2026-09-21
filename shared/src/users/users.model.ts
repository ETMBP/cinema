// User schema and type so frontend and backend will agree on it.

import { z } from 'zod';

export const publicUserSchema = z.object({
  id: z.number().int().positive(),
  username: z.string(),
  email: z.string(),
  isEnabled: z.boolean(),
  created: z.coerce.date(),
  roles: z.array(z.string()),
});

export type PublicUser = z.infer<typeof publicUserSchema>;

export const publicUsersSchema = z.array(publicUserSchema);

export const userUpdateDataSchema = z
  .object({
    email: z.email().optional(),
    isEnabled: z.boolean().optional(),
  })
  .refine((d) => d.email ?? typeof d.isEnabled !== 'undefined', {
    error: 'nothing to update',
  });

export type UserUpdateData = z.infer<typeof userUpdateDataSchema>;

export const userPasswordUpdateDataSchema = z.object({
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(8),
});

export type UserUpdatePasswordData = z.infer<
  typeof userPasswordUpdateDataSchema
>;

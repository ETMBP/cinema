import z from 'zod';
import { publicUserSchema } from '../users/users.model.js';
import { roleSchema } from './roles.model.js';

export const loginRequestSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  user: publicUserSchema,
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const accessTokenPayloadSchema = z.object({
  sub: z.coerce.number().int().positive(),
  roles: roleSchema.array(),
});

export const authUserSchema = z.object({
  id: z.coerce.number().int().positive(),
  roles: roleSchema.array(),
});

export type AuthUser = z.infer<typeof authUserSchema>;

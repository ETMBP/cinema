// User models and schemas

import { Router } from 'express';
import type { UsersService } from './users.service.js';
import { z } from 'zod';

// Interface for returning the inited user module
export interface UsersModule {
  service: UsersService;
  router: Router;
}

// Schema to represent users in the DB
export const userRowSchema = z.object({
  id: z.coerce.number().int().positive(),
  username: z.string(),
  email: z.string(),
  passwordHash: z.string(),
  isEnabled: z.coerce
    .number()
    .int()
    .min(0)
    .max(1)
    .transform((v) => v === 1),
  roles: z
    .string()
    .nullable()
    .transform((s) => (s ? s.split(',') : [])),
  created: z.coerce.date(),
});

// Type from the schema
export type UserRow = z.infer<typeof userRowSchema>;

// Validating the input for getting user by an ID from param
export const idParamSchema = z.coerce.number().int().positive();

export const newUserSchema = z.object({
  username: z.string().min(1).max(25),
  email: z.email(),
  password: z.string().min(8),
});

export type NewUser = z.infer<typeof newUserSchema>;

export const roleRowSchema = z.object({
  id: z.coerce.number().int().positive().min(1),
  name: z.string().min(1),
});

export type RoleRow = z.infer<typeof roleRowSchema>;

export interface IUserTokenStore {
  revokeAllForUser(userId: number): Promise<void>;
  savePwReset(userId: number, tokenId: string): Promise<void>;
  getPwReset(tokenId: string): Promise<string | undefined>;
}

export const passwordResetParamsSchema = z.object({
  token: z.uuid(),
  newPassword: z.string().min(8),
});

export type PasswordResetParams = z.infer<typeof passwordResetParamsSchema>;

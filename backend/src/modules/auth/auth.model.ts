// Authentication related models

import type { PublicUser } from '@cinema/shared';
import z from 'zod';
import { REFRESH_COOKIE } from './auth.controller.js';

export const refreshTokenRecordSchema = z.object({
  tokenId: z.uuid(),
  userId: z.number().int().positive(),
  expiresAt: z.coerce.date(),
});

export type RefreshTokenRecord = z.infer<typeof refreshTokenRecordSchema>;

export interface ITokenStore {
  save(record: RefreshTokenRecord): Promise<void>;
  find(tokenId: string): Promise<RefreshTokenRecord | undefined>;
  revoke(tokenId: string): Promise<void>;
  revokeAllForUser(userId: number): Promise<void>;
}

export interface LoginResult {
  user: PublicUser;
  refreshToken: string;
  accessToken: string;
}

export const refreshTokenSchema = z.object({
  jti: z.uuid(),
  sub: z.coerce.number().int().positive(),
  exp: z.coerce.number().transform((s) => new Date(s * 1000)),
});

export type RefreshToken = z.infer<typeof refreshTokenSchema>;

export interface IVerifiedRefresToken {
  user: PublicUser;
  tokenId: string;
}

export const refreshCookieSchema = z.object({
  [REFRESH_COOKIE]: z.string().min(1),
});

// Authentication related models

import type { PublicUser } from '@cinema/shared';
import z from 'zod';

export const REFRESH_COOKIE = 'refreshToken';

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

export interface IVerifiedRefreshToken {
  user: PublicUser;
  tokenId: string;
}

export const refreshCookieSchema = z.object({
  [REFRESH_COOKIE]: z.string().min(1),
});

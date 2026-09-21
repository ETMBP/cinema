import type { CookieOptions, RequestHandler } from 'express';
import type { AuthService } from './auth.service.js';
import { AppError } from '#core/error.js';
import {
  authUserSchema,
  loginRequestSchema,
  type LoginResponse,
} from '@cinema/shared';
import z from 'zod';
import { refreshCookieSchema } from './auth.model.js';

export const REFRESH_COOKIE = 'refreshToken';

export interface AuthCookieDeps {
  isProduction: boolean;
  refreshTtlSeconds: number;
}

export function createAuthController(
  auth: AuthService,
  { isProduction, refreshTtlSeconds }: AuthCookieDeps,
) {
  const refreshCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: refreshTtlSeconds * 1000,
  };

  const login: RequestHandler = async (req, res) => {
    const body = loginRequestSchema.safeParse(req.body);
    if (!body.success) {
      throw new AppError(
        400,
        'INVALID_REQUEST',
        'Invalid request body',
        z.flattenError(body.error).fieldErrors,
      );
    }
    const { accessToken, refreshToken, user } = await auth.login(body.data);

    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);
    const response: LoginResponse = { accessToken, user };
    res.json(response);
  };

  const logout: RequestHandler = (req, res) => {
    const cookies = refreshCookieSchema.safeParse(req.cookies);
    if (!cookies.success) {
      const error = z.flattenError(cookies.error).fieldErrors;
      req.log.info({ error }, 'logout did not carry refreshtoken');
    } else {
      const tokenId = auth.decodeRefreshToken(cookies.data[REFRESH_COOKIE]);
      if (tokenId) {
        void auth.revokeRefreshToken(tokenId).catch((error: unknown) => {
          req.log.error({ error }, 'token revocation failed during logout');
        });
      }
    }
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions);
    res.json({});
  };

  const refresh: RequestHandler = async (req, res) => {
    const cookies = refreshCookieSchema.safeParse(req.cookies);
    if (!cookies.success) {
      throw new AppError(401, 'INVALID_TOKEN', 'token verification failed');
    }

    const { accessToken, refreshToken, user } = await auth.refresh(
      cookies.data.refreshToken,
    );
    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);
    const response: LoginResponse = { accessToken, user };
    res.json(response);
  };

  const logoutEverywhere: RequestHandler = async (req, res) => {
    const user = authUserSchema.safeParse(req.user);
    if (!user.success) {
      throw new AppError(401, 'UNAUTHORIZED', 'not authenticated');
    }
    await auth.revokeAllRefreshToken(user.data.id);
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions);
    res.json({});
  };

  return { login, logout, logoutEverywhere, refresh };
}

export type AuthController = ReturnType<typeof createAuthController>;

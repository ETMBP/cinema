// Auth middleware
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { AppError } from '#core/error.js';
import {
  accessTokenPayloadSchema,
  can,
  type AuthUser,
  type Permission,
} from '@cinema/shared';
import type { RequestHandler } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

export function createAuthMiddleware(jwtAccessSecret: string) {
  const authenticate: RequestHandler = (req, _res, next) => {
    const authField = req.headers.authorization;
    if (!authField?.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHENTICATED', 'Missing access token');
    }

    let payload: string | JwtPayload;
    try {
      payload = jwt.verify(authField.slice(7), jwtAccessSecret, {
        algorithms: ['HS256'],
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(401, 'INVALID_TOKEN', 'Access token is invalid');
    }

    const claims = accessTokenPayloadSchema.safeParse(payload);
    if (!claims.success) {
      throw new AppError(
        401,
        'INVALID_TOKEN',
        'Access token verification failed',
      );
    }

    req.user = { id: claims.data.sub, roles: claims.data.roles };
    next();
  };

  const requirePermission =
    (permission: Permission): RequestHandler =>
    (req, _res, next) => {
      if (!req.user) {
        throw new Error('requirePermission before authenticate');
      }
      if (!can(req.user.roles, permission)) {
        throw new AppError(403, 'FORBIDDEN', 'Missing permission');
      }
      next();
    };

  return { authenticate, requirePermission };
}

export type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

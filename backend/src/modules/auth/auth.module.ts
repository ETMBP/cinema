import type { IJwtOptions } from '#core/config.js';
import type { UsersService } from '#modules/users/users.service.js';
import { TokenStore } from '../../core/db/token.store.js';
import { AuthService } from './auth.service.js';
import { createAuthController } from './auth.controller.js';
import { createAuthRouter } from './auth.router.js';
import type { Router } from 'express';
import type { Logger } from 'pino';
import type { AuthMiddleware } from './auth.middleware.js';

export function createAuthModule(
  tokenStore: TokenStore,
  jwtOptions: IJwtOptions,
  usersService: UsersService,
  authMw: AuthMiddleware,
  logger: Logger,
): Router {
  const service = new AuthService(jwtOptions, usersService, tokenStore, logger);
  const controller = createAuthController(service, {
    isProduction: jwtOptions.isProduction,
    refreshTtlSeconds: jwtOptions.refreshTtlSeconds,
  });

  return createAuthRouter(controller, authMw);
}

import { Router } from 'express';
import type { AuthController } from './auth.controller.js';
import type { AuthMiddleware } from './auth.middleware.js';

export function createAuthRouter(
  controller: AuthController,
  authMw: AuthMiddleware,
): Router {
  const router = Router();

  router.post('/login', controller.login);
  router.post('/logout', authMw.authenticate, controller.logout);
  router.post('/revoke-all', authMw.authenticate, controller.logoutEverywhere);
  router.post('/refresh', controller.refresh);

  return router;
}

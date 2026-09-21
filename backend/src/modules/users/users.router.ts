import { Router } from 'express';
import type { UsersController } from './users.controller.js';
import type { AuthMiddleware } from '#modules/auth/auth.middleware.js';

export function createUserRouter(
  controller: UsersController,
  authMw: AuthMiddleware,
): Router {
  const router = Router();

  router.post('/register', controller.registerUser);

  // Self service endpoints
  router.get('/me', authMw.authenticate, controller.getSelfById);
  router.patch('/me', authMw.authenticate, controller.updateSelf);
  router.patch(
    '/me/password',
    authMw.authenticate,
    controller.updateSelfPassword,
  );
  router.post('/request-reset', controller.requestPasswordReset);
  router.put('/request-reset', controller.resetPassword);

  // User management endpoints
  router.get(
    '/all',
    authMw.authenticate,
    authMw.requirePermission('users:read'),
    controller.getAllUser,
  );
  router.get(
    '/:id',
    authMw.authenticate,
    authMw.requirePermission('users:read'),
    controller.getById,
  );
  router.patch(
    '/:id',
    authMw.authenticate,
    authMw.requirePermission('users:edit'),
    controller.updateUser,
  );
  router.patch(
    '/:id/password',
    authMw.authenticate,
    authMw.requirePermission('users:edit'),
    controller.updateUserPassword,
  );
  router.put(
    '/:id/roles',
    authMw.authenticate,
    authMw.requirePermission('roles:manage'),
    controller.setUserRoles,
  );
  return router;
}

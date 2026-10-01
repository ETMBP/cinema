import { Router } from 'express';
import type { MoviesController } from './movies.controller.js';
import type { AuthMiddleware } from '#modules/auth/auth.middleware.js';

export function createMoviesRouter(
  controller: MoviesController,
  authMw: AuthMiddleware,
): Router {
  const router = Router();

  router.post(
    '/',
    authMw.authenticate,
    authMw.requirePermission('movies:create'),
    controller.createMovie,
  );
  router.get(
    '/list',
    authMw.authenticate,
    authMw.requirePermission('movies:read'),
    controller.getList,
  );
  router.get(
    '/:id',
    authMw.authenticate,
    authMw.requirePermission('movies:read'),
    controller.getById,
  );
  router.patch(
    '/:id',
    authMw.authenticate,
    authMw.requirePermission('movies:edit'),
    controller.updateMovie,
  );
  router.delete(
    '/:id',
    authMw.authenticate,
    authMw.requirePermission('movies:delete'),
    controller.deleteMovie,
  );

  return router;
}

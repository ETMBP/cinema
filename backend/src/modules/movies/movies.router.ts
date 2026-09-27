import { Router } from 'express';
import type { MoviesController } from './movies.controller.js';
import type { AuthMiddleware } from '#modules/auth/auth.middleware.js';

export function createMoviesRouter(
  controller: MoviesController,
  authMw: AuthMiddleware,
): Router {
  const router = Router();

  router.get(
    '/:id',
    authMw.authenticate,
    authMw.requirePermission('movies:read'),
    controller.getById,
  );
  router.post(
    '/new',
    authMw.authenticate,
    authMw.requirePermission('movies:create'),
    controller.createMovie,
  );

  return router;
}

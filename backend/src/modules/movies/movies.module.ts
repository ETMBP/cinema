import type { DbPool } from '#core/db/db.repo.js';
import type { AuthMiddleware } from '#modules/auth/auth.middleware.js';
import { createMoviesController } from './movies.controller.js';
import type { MoviesModule } from './movies.model.js';
import { MoviesRepo as MoviesRepo } from './movies.repo.js';
import { createMoviesRouter } from './movies.router.js';
import { MoviesService } from './movies.service.js';

export function createMoviesModule(
  dbPool: DbPool,
  authMw: AuthMiddleware,
): MoviesModule {
  const repo = new MoviesRepo(dbPool);
  const service = new MoviesService(repo);
  const controller = createMoviesController(service);
  const router = createMoviesRouter(controller, authMw);

  return { router };
}

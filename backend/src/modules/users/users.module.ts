import { UsersService } from './users.service.js';
import type { DbPool } from '#core/db/db.repo.js';
import { UsersRepo } from './users.repo.js';
import { createUserRouter } from './users.router.js';
import type { IUserTokenStore, UsersModule } from './users.model.js';
import { createUserController } from './users.controller.js';
import type { AuthMiddleware } from '#modules/auth/auth.middleware.js';
import type { SmtpMailer } from '#core/mail/smtp.js';
import type { IAppOptions } from '#core/config.js';

export function createUsersModule(
  db: DbPool,
  authMw: AuthMiddleware,
  sessions: IUserTokenStore,
  mail: SmtpMailer,
  appConfig: IAppOptions,
): UsersModule {
  const repo = new UsersRepo(db);
  const service = new UsersService(repo, sessions, db, mail, appConfig);
  const controller = createUserController(service);

  return { service, router: createUserRouter(controller, authMw) };
}

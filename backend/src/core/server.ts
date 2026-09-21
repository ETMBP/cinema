import { DbPool } from '#core/db/db.repo.js';
import type { Server as HttpServer } from 'node:http';
import type { Logger } from 'pino';
import { Config } from './config.js';
import { createLogger } from './logger.js';
import { createUsersModule } from '#modules/users/users.module.js';
import type { Router } from 'express';
import { App } from '#app.js';
import { RedisConnection } from '#core/redis/redis.js';
import { SmtpMailer } from './mail/smtp.js';
import { createAuthModule } from '#modules/auth/auth.module.js';
import { createAuthMiddleware } from '#modules/auth/auth.middleware.js';
import { TokenStore } from './db/token.store.js';

export interface IAppRouters {
  users: Router;
  auth: Router;
}

export interface IAppDeps {
  config: Config;
  logger: Logger;
  routers: IAppRouters;
}

export class Server {
  #logger?: Logger;
  #db?: DbPool;
  #redisConnection?: RedisConnection;
  #http?: HttpServer;
  #stopping = false;

  async start(): Promise<void> {
    const config = new Config(process.env);
    const logger = createLogger(config.logLevel);
    const db = new DbPool(config.db);
    const redisConnection = new RedisConnection(config.redis, logger);
    const mail = new SmtpMailer(config.mail, logger);

    // DB & Redis Test
    await db.verify();
    await redisConnection.connect();
    try {
      await mail.verify();
    } catch (error) {
      logger.error(error);
    }

    // Middlewares
    const authMiddleware = createAuthMiddleware(config.jwt.accessSecret);

    // Modules
    const tokenStore = new TokenStore(redisConnection.client);
    const users = createUsersModule(
      db,
      authMiddleware,
      tokenStore,
      mail,
      config.app,
    );
    const auth = createAuthModule(
      tokenStore,
      config.jwt,
      users.service,
      authMiddleware,
      logger.child({ module: 'auth' }),
    );
    const app = new App({
      config,
      logger,
      routers: { users: users.router, auth: auth },
    }).app;

    // App Start
    this.#logger = logger;
    this.#db = db;
    this.#redisConnection = redisConnection;
    this.#http = app.listen(config.appPort, () => {
      logger.info(
        { port: config.appPort, env: config.nodeEnv },
        'backend is listening',
      );
    });
  }

  async stop(): Promise<void> {
    if (this.#stopping) return;
    this.#stopping = true;
    this.#logger?.info('Shutting down');

    const http = this.#http;
    if (http) {
      const closed = new Promise<void>((resolve, reject) => {
        http.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
      http.closeIdleConnections();

      const deadline = setTimeout(() => {
        this.#logger?.warn('Shutdown deadline hit, forcing connections closed');
        http.closeAllConnections();
      }, 10000);
      await closed;
      clearTimeout(deadline);
    }

    await this.#db?.end();
    await this.#redisConnection?.end();
    this.#logger?.info('Shutdown complete');
  }
}

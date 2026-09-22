// Assembles the express app and exports it - no listen() here, ever.
// When you write it:
//   - security/parsing middleware first: helmet, express.json(), cookie parsing
//   - mount each module's router: app.use("/api/auth", authRouter), ...
//   - error-handling middleware LAST (express matches it by its 4-arg signature)
import type { Config } from '#core/config.js';
import cors, { type CorsOptions } from 'cors';
import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import type { IAppDeps, IAppRouters } from '#core/server.js';
import type { Logger } from 'pino';
import { errorHandler, notFoundHandler } from '#middleware/error.middleware.js';

export class App {
  app: Express;
  config: Config;
  logger: Logger;

  constructor({ config, logger, routers }: IAppDeps) {
    this.app = express();
    this.config = config;
    this.logger = logger;
    this.setupApp();
    this.addRoutes(routers);

    //Last middlewares for error handling
    // Do not add anything after this
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  setupApp() {
    const logger = this.logger;
    const extUrl = new URL(
      `${this.config.app.protocol}://${this.config.app.host}`,
    );
    extUrl.port = this.config.app.port.toString();
    const corsUrls: string[] = [extUrl.href];
    if (this.config.app.host === 'localhost') {
      corsUrls.push(`http://${this.config.appHost}:5173`);
    }
    const corsOptions: CorsOptions = {
      credentials: true,
      origin: corsUrls,
    };
    this.app.use(cors(corsOptions));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(pinoHttp({ logger }));
    this.app.use(cookieParser());
    this.app.use(helmet());
  }

  addRoutes(routers: IAppRouters) {
    this.app.use('/api/user', routers.users);
    this.app.use('/api/auth', routers.auth);
  }
}

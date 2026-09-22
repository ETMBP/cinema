// Config loader for config from env vars

import { z } from 'zod';

const configSchema = z.object({
  APP_PROTOCOL: z.string().default('https'),
  APP_HOST: z.string().min(1),
  APP_PORT: z.coerce.number().int().positive().default(3000),
  APP_EXT_PORT: z.coerce.number().int().positive().default(443),
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),
  DB_TIMEZONE: z.string().min(1).default('Z'),
  RD_HOST: z.string().min(1),
  RD_PORT: z.coerce.number().int().positive().default(6379),
  RD_USER: z.string().min(1),
  RD_PASSWORD: z.string().min(1),
  JWT_ACCESS_TTL: z.coerce.number().int().positive().default(900),
  JWT_ACCESS_SECRET: z.string().min(64),
  JWT_REFRESH_TTL: z.coerce.number().int().positive().default(604800),
  JWT_REFRESH_SECRET: z.string().min(64),
  MAIL_HOST: z.string().min(1),
  MAIL_PORT: z.coerce.number().int().positive().default(25),
  MAIL_AUTH_USER: z.string().min(1),
  MAIL_PASSWORD: z.string().min(1),
  MAIL_FROM_NAME: z.string().min(1),
  MAIL_FROM_ADDRESS: z.string().min(1),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
});

type ConfigData = z.infer<typeof configSchema>;

export interface IAppOptions {
  protocol: string;
  host: string;
  port: number;
  extPort: number;
  url: URL;
}

export interface IDbOptions {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  timezone: string;
}

export interface IRedisOptions {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

export interface IJwtOptions {
  accessSecret: string;
  accessTtlSeconds: number;
  refreshSecret: string;
  refreshTtlSeconds: number;
  isProduction: boolean;
}

export interface IMailOptions {
  host: string;
  port: number;
  username: string;
  password: string;
  fromName: string;
  fromAddress: string;
}

export class Config {
  readonly #data: ConfigData;
  constructor(env: NodeJS.ProcessEnv) {
    const result = configSchema.safeParse(env);
    if (!result.success) {
      throw new Error(
        `Invalid environment config:\n${z.prettifyError(result.error)}`,
      );
    }
    this.#data = result.data;
  }

  get nodeEnv(): string {
    return this.#data.NODE_ENV;
  }

  get isProduction(): boolean {
    return this.#data.NODE_ENV === 'production';
  }

  get appHost(): string {
    return this.#data.APP_HOST;
  }

  get appPort(): number {
    return this.#data.APP_PORT;
  }

  get logLevel(): string {
    return this.#data.LOG_LEVEL;
  }

  get app(): IAppOptions {
    const extPort =
      this.#data.APP_EXT_PORT === 80 || this.#data.APP_EXT_PORT === 443
        ? undefined
        : this.#data.APP_EXT_PORT;
    const url = new URL(`${this.#data.APP_PROTOCOL}://${this.#data.APP_HOST}`);
    if (extPort) {
      url.port = extPort.toString();
    }

    return {
      protocol: this.#data.APP_PROTOCOL,
      host: this.#data.APP_HOST,
      port: this.#data.APP_PORT,
      extPort: this.#data.APP_EXT_PORT,
      url: url,
    };
  }

  get db(): IDbOptions {
    return {
      host: this.#data.DB_HOST,
      port: this.#data.DB_PORT,
      username: this.#data.DB_USER,
      password: this.#data.DB_PASSWORD,
      database: this.#data.DB_NAME,
      timezone: this.#data.DB_TIMEZONE,
    };
  }

  get redis(): IRedisOptions {
    return {
      host: this.#data.RD_HOST,
      port: this.#data.RD_PORT,
      username: this.#data.RD_USER,
      password: this.#data.RD_PASSWORD,
    };
  }

  get jwt(): IJwtOptions {
    return {
      accessSecret: this.#data.JWT_ACCESS_SECRET,
      accessTtlSeconds: this.#data.JWT_ACCESS_TTL,
      refreshSecret: this.#data.JWT_REFRESH_SECRET,
      refreshTtlSeconds: this.#data.JWT_REFRESH_TTL,
      isProduction: this.isProduction,
    };
  }

  get mail(): IMailOptions {
    return {
      host: this.#data.MAIL_HOST,
      port: this.#data.MAIL_PORT,
      username: this.#data.MAIL_AUTH_USER,
      password: this.#data.MAIL_PASSWORD,
      fromName: this.#data.MAIL_FROM_NAME,
      fromAddress: this.#data.MAIL_FROM_ADDRESS,
    };
  }
}

import { createClient } from 'redis';
import type { Logger } from 'pino';
import type { IRedisOptions } from '#core/config.js';

export type RedisClient = ReturnType<typeof createClient>;

export class RedisConnection {
  readonly #client: RedisClient;

  constructor(options: IRedisOptions, logger: Logger) {
    this.#client = createClient({
      socket: { host: options.host, port: options.port },
      username: options.username,
      password: options.password,
    });
    this.#client.on('ready', () => {
      logger.info('redis is ready');
    });
    this.#client.on('error', (err) => {
      logger.error({ err }, 'redis error');
    });
  }

  get client(): RedisClient {
    return this.#client;
  }

  async connect(): Promise<void> {
    await this.#client.connect();
  }

  async end(): Promise<void> {
    await this.#client.close();
  }
}

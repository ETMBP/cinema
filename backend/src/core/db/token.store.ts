import type { RedisClient } from '#core/redis/redis.js';
import { createHash } from 'crypto';

import {
  refreshTokenRecordSchema,
  type ITokenStore,
  type RefreshTokenRecord,
} from '#core/db/token.model.js';

export class TokenStore implements ITokenStore {
  readonly #redis: RedisClient;

  constructor(redis: RedisClient) {
    this.#redis = redis;
  }

  #tokenKey(tokenId: string): string {
    return `refresh:${tokenId}`;
  }

  #userKey(userId: number): string {
    return `user-refresh:${userId}`;
  }

  #resetKey(tokenId: string): string {
    return `reset:${createHash('sha256').update(tokenId).digest('hex')}`;
  }

  #ttlSeconds(record: RefreshTokenRecord): number {
    return Math.max(
      1,
      Math.ceil((record.expiresAt.getTime() - Date.now()) / 1000),
    );
  }

  async save(record: RefreshTokenRecord): Promise<void> {
    const ttl = this.#ttlSeconds(record);
    await this.#redis
      .multi()
      .set(this.#tokenKey(record.tokenId), JSON.stringify(record), {
        expiration: { type: 'EX', value: ttl },
      })
      .sAdd(this.#userKey(record.userId), record.tokenId)
      .expire(this.#userKey(record.userId), ttl)
      .exec();
  }

  async find(tokenId: string): Promise<RefreshTokenRecord | undefined> {
    const raw = await this.#redis.get(this.#tokenKey(tokenId));
    if (raw === null) {
      return undefined;
    }
    return refreshTokenRecordSchema.parse(JSON.parse(raw));
  }

  async revoke(tokenId: string): Promise<void> {
    const record = await this.find(tokenId);
    if (!record) {
      return;
    }
    await this.#redis
      .multi()
      .del(this.#tokenKey(tokenId))
      .sRem(this.#userKey(record.userId), tokenId)
      .exec();
  }

  async revokeAllForUser(userId: number): Promise<void> {
    const tokenIds = await this.#redis.sMembers(this.#userKey(userId));
    const keys = tokenIds.map((id) => this.#tokenKey(id));
    await this.#redis.del([...keys, this.#userKey(userId)]);
  }

  async savePwReset(userId: number, tokenId: string): Promise<void> {
    await this.#redis.set(this.#resetKey(tokenId), userId, {
      expiration: { type: 'EX', value: 900 },
    });
  }

  async getPwReset(tokenId: string): Promise<string | undefined> {
    const result = await this.#redis.getDel(this.#resetKey(tokenId));
    if (result === null) {
      return undefined;
    }
    return result;
  }
}

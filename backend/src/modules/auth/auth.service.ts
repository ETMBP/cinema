// Authentication and authorization related logic

import type { UsersService } from '#modules/users/users.service.js';
import type { LoginRequest, PublicUser } from '@cinema/shared';
import {
  refreshTokenSchema,
  type IVerifiedRefresToken,
  type LoginResult,
} from './auth.model.js';
import { AppError } from '#core/error.js';
import type { IJwtOptions } from '#core/config.js';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import type { TokenStore } from '../../core/db/token.store.js';
import type { Logger } from 'pino';

export class AuthService {
  readonly #jwtOptions: IJwtOptions;
  readonly #usersService: UsersService;
  readonly #tokenStore: TokenStore;
  readonly #logger: Logger;

  constructor(
    jwtOptions: IJwtOptions,
    usersService: UsersService,
    tokenStore: TokenStore,
    logger: Logger,
  ) {
    this.#jwtOptions = jwtOptions;
    this.#usersService = usersService;
    this.#tokenStore = tokenStore;
    this.#logger = logger;
  }

  async verifyCredentials(loginData: LoginRequest): Promise<PublicUser> {
    const result = await this.#usersService.verifyLogin(loginData);
    if (!result) {
      throw new AppError(401, 'AUTH_FAILED', 'Username or password is invalid');
    }
    if (!result.isEnabled) {
      throw new AppError(
        403,
        'AUTH_FAILED',
        'User is disabled, login prohibited',
      );
    }
    return result;
  }

  async verifyRefreshToken(
    refreshToken: string,
  ): Promise<IVerifiedRefresToken> {
    let payload: string | JwtPayload;
    try {
      payload = jwt.verify(refreshToken, this.#jwtOptions.refreshSecret, {
        algorithms: ['HS256'],
      });
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError(401, 'TOKEN_EXPIRED', 'Refresh token expired');
      }
      throw new AppError(
        401,
        'INVALID_TOKEN',
        'Refresh token verification failed',
      );
    }

    const claims = refreshTokenSchema.safeParse(payload);
    if (!claims.success) {
      throw new AppError(
        401,
        'INVALID_TOKEN',
        'Refresh token verification failed',
      );
    }
    const stored = await this.#tokenStore.find(claims.data.jti);
    if (!stored) {
      this.#logger.warn(
        { userId: claims.data.sub, jti: claims.data.jti },
        'valid refresh token not in allowlist (revoked, rotated, or replayed)',
      );
      throw new AppError(
        401,
        'INVALID_TOKEN',
        'Refresh token verification failed',
      );
    }

    const user = await this.#usersService.getById(claims.data.sub);
    if (!user) {
      throw new AppError(
        401,
        'INVALID_TOKEN',
        'Refresh token verification failed',
      );
    }
    if (!user.isEnabled) {
      throw new AppError(
        403,
        'USER_DISABLED',
        'User disabled, login forbidden',
      );
    }

    return { user, tokenId: claims.data.jti };
  }

  newAccessToken(user: PublicUser): string {
    const accessToken = jwt.sign(
      { roles: user.roles },
      this.#jwtOptions.accessSecret,
      {
        subject: String(user.id),
        expiresIn: this.#jwtOptions.accessTtlSeconds,
      },
    );
    return accessToken;
  }

  async newRefreshToken(user: PublicUser): Promise<string> {
    const tokenId = crypto.randomUUID();
    const refreshToken = jwt.sign({}, this.#jwtOptions.refreshSecret, {
      subject: String(user.id),
      jwtid: tokenId,
      expiresIn: this.#jwtOptions.refreshTtlSeconds,
    });
    const expiresAt =
      jwt.decode(refreshToken, { json: true })?.exp ??
      Math.floor(Date.now() / 1000) + this.#jwtOptions.refreshTtlSeconds;
    await this.#tokenStore.save({
      tokenId: tokenId,
      userId: user.id,
      expiresAt: new Date(expiresAt * 1000),
    });
    return refreshToken;
  }

  async revokeRefreshToken(tokenId: string): Promise<void> {
    await this.#tokenStore.revoke(tokenId);
  }

  async revokeAllRefreshToken(userId: number): Promise<void> {
    await this.#tokenStore.revokeAllForUser(userId);
  }

  decodeRefreshToken(token: string): string | undefined {
    const tokenData = jwt.decode(token);
    if (typeof tokenData !== 'string' && tokenData?.jti) {
      return tokenData.jti;
    }
    return undefined;
  }

  async login(credentials: LoginRequest): Promise<LoginResult> {
    const user = await this.verifyCredentials(credentials);
    if (!user.isEnabled) {
      throw new AppError(403, 'USER_DISABLED', 'This user is disabled');
    }
    const refreshToken = await this.newRefreshToken(user);
    const accessToken = this.newAccessToken(user);
    return {
      user: user,
      refreshToken: refreshToken,
      accessToken: accessToken,
    };
  }
  async refresh(refreshToken: string): Promise<LoginResult> {
    const verificationResult = await this.verifyRefreshToken(refreshToken);
    await this.revokeRefreshToken(verificationResult.tokenId);
    const newRefreshToken = await this.newRefreshToken(verificationResult.user);
    const newAccessToken = this.newAccessToken(verificationResult.user);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: verificationResult.user,
    };
  }
}

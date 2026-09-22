import { UsersRepo } from './users.repo.js';
import { publicUserSchema, publicUsersSchema } from '@cinema/shared';
import type {
  LoginRequest,
  PublicUser,
  Role,
  UserUpdateData,
} from '@cinema/shared';
import type {
  NewUser,
  IUserTokenStore,
  UserRow,
  PasswordResetParams,
} from './users.model.js';
import argon2 from 'argon2';
import { AppError } from '#core/error.js';
import type { DbPool } from '#core/db/db.repo.js';
import type { SmtpMailer } from '#core/mail/smtp.js';
import {
  passwordResetTemplate,
  welcomeTemplate,
} from '#core/mail/templates.js';
import type { IAppOptions } from '#core/config.js';

export class UsersService {
  readonly #repo: UsersRepo;
  readonly #hashOptions = {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
    hashLength: 32,
  } satisfies argon2.HashOptions;
  readonly defaultRoleName = 'user';
  readonly #sessions: IUserTokenStore;
  readonly #dbPool: DbPool;
  readonly #mail: SmtpMailer;
  readonly #appConfig: IAppOptions;

  constructor(
    repo: UsersRepo,
    sessions: IUserTokenStore,
    dbPool: DbPool,
    mail: SmtpMailer,
    appConfig: IAppOptions,
  ) {
    this.#repo = repo;
    this.#sessions = sessions;
    this.#dbPool = dbPool;
    this.#mail = mail;
    this.#appConfig = appConfig;
  }

  async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password, this.#hashOptions);
  }

  async getById(id: number): Promise<PublicUser | undefined> {
    const row = await this.#repo.findById(id);
    return row ? publicUserSchema.parse(row) : undefined;
  }

  async getByUsername(username: string): Promise<PublicUser | undefined> {
    const row = await this.#repo.findByUsername(username);
    return row ? publicUserSchema.parse(row) : undefined;
  }

  async getByEmail(email: string): Promise<PublicUser | undefined> {
    const row = await this.#repo.findByEmail(email);
    return row ? publicUserSchema.parse(row) : undefined;
  }

  async getAllUser(): Promise<PublicUser[]> {
    const rows = await this.#repo.findAllUser();
    return publicUsersSchema.parse(rows);
  }

  async getByIdPrivate(id: number): Promise<UserRow | undefined> {
    const row = await this.#repo.findById(id);
    return row;
  }

  async getByUsernamePrivate(username: string): Promise<UserRow | undefined> {
    const row = await this.#repo.findByUsername(username);
    return row;
  }

  async setEmailAddress(userId: number, email: string): Promise<void> {
    await this.#repo.updateEmail(userId, email);
  }

  async updatePasswordHash(userId: number, newPassword: string): Promise<void> {
    const newPasswordHash = await this.hashPassword(newPassword);
    await this.#repo.updatePasswordHash(userId, newPasswordHash);
    await this.#sessions.revokeAllForUser(userId);
  }

  async updateSelfPasswordHash(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.getByIdPrivate(userId);
    if (!user) {
      throw new AppError(401, 'INVALID_TOKEN', 'user no longer exists');
    }
    const isMatch = await argon2.verify(user.passwordHash, currentPassword);
    if (!isMatch) {
      throw new AppError(
        400,
        'WRONG_PASSWORD',
        'current password is incorrect',
      );
    }
    await this.updatePasswordHash(userId, newPassword);
  }

  async updateIsEnabled(userId: number, isEnabled: boolean): Promise<void> {
    await this.#repo.updateEnabled(userId, isEnabled);
    if (!isEnabled) {
      await this.#sessions.revokeAllForUser(userId);
    }
  }

  async updateUser(
    userId: number,
    updateData: UserUpdateData,
  ): Promise<PublicUser | undefined> {
    if (updateData.email) {
      await this.setEmailAddress(userId, updateData.email);
    }
    if (typeof updateData.isEnabled !== 'undefined') {
      await this.updateIsEnabled(userId, updateData.isEnabled);
    }

    return await this.getById(userId);
  }

  async setUserRoles(userId: number, roles: Role[]): Promise<PublicUser> {
    const currentRoles = await this.#repo.getUserRoles(userId);
    // dedup so it don't fail on insert duplicated value
    const dedupedRoles = [...new Set(roles)];
    const rolesToAdd = dedupedRoles.filter(
      (role) => !currentRoles.map((role) => role.name).includes(role),
    );
    const rolesToRemove = currentRoles.filter(
      (role) => !dedupedRoles.includes(role.name as Role),
    );
    const addIds: number[] = [];

    for (const role of rolesToAdd) {
      const roleRow = await this.#repo.getRoleByName(role);
      if (!roleRow) {
        throw new Error(`${role} role does not exists in the db`);
      }
      addIds.push(roleRow.id);
    }

    await this.#dbPool.withTransaction(async (tx) => {
      for (const id of addIds) {
        await this.#repo.addUserRole(id, userId, tx);
      }
      for (const role of rolesToRemove) {
        if (role.name === 'user') {
          throw new AppError(
            400,
            'VALIDATION',
            'user is the default role and cannot be removed',
          );
        }
        await this.#repo.deleteUserRole(role.id, userId, tx);
      }
    });

    const modifiedUser = await this.getById(userId);

    if (!modifiedUser) {
      throw new AppError(
        404,
        'USER_NOT_FOUND',
        'user was deleted during the operation',
      );
    }

    return modifiedUser;
  }

  async verifyLogin(loginData: LoginRequest): Promise<PublicUser | undefined> {
    //TODO dummyHash
    const row = await this.getByUsernamePrivate(loginData.username);
    if (row) {
      if (await argon2.verify(row.passwordHash, loginData.password)) {
        return publicUserSchema.parse(row);
      }
    }
    return undefined;
  }

  async requestSelfPasswordReset(email: string): Promise<void> {
    const user = await this.getByEmail(email);
    if (!user) {
      // not throwing so existing and non-existing mail acts the same.
      return;
    }

    const resetToken = crypto.randomUUID();
    await this.#sessions.savePwReset(user.id, resetToken);
    const url = this.#appConfig.url;
    url.pathname = '/password-reset';
    url.searchParams.append('token', resetToken);

    await this.#mail.sendMail(
      passwordResetTemplate({
        username: user.username,
        url: url.toString(),
      }),
      user.email,
    );
  }

  async resetSelfPassword(p: PasswordResetParams): Promise<void> {
    const storedToken = await this.#sessions.getPwReset(p.token);
    if (!storedToken) {
      throw new AppError(401, 'INVALID_TOKEN', 'the token is invalid');
    }

    const user = await this.getById(Number(storedToken));
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'user was not found');
    }
    await this.updatePasswordHash(user.id, p.newPassword);
  }

  async createUser(user: NewUser): Promise<PublicUser> {
    const passwordHash = await this.hashPassword(user.password);
    await this.#dbPool.withTransaction(async (tx) => {
      const { insertId } = await this.#repo.newUser(user, passwordHash, tx);
      const role = await this.#repo.getRoleByName(this.defaultRoleName);
      if (!role) {
        throw new Error('Default role does not exist');
      }
      await this.#repo.addUserRole(role.id, insertId, tx);
    });
    const newUser = await this.#repo.findByUsername(user.username);
    if (!newUser) {
      throw new Error('User creation silently failed');
    }
    void this.#mail.sendMail(
      welcomeTemplate({ username: user.username }),
      user.email,
    );

    return publicUserSchema.parse(newUser);
  }
}

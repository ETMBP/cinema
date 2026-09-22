import type { RequestHandler } from 'express';
import type { UsersService } from './users.service.js';
import { AppError } from '#core/error.js';
import {
  idParamSchema,
  newUserSchema,
  passwordResetParamsSchema,
} from './users.model.js';
import {
  roleSchema,
  userPasswordUpdateDataSchema,
  userSelfUpdateDataSchema,
  userUpdateDataSchema,
} from '@cinema/shared';
import z from 'zod';

export function createUserController(users: UsersService) {
  const registerUser: RequestHandler = async (req, res) => {
    const newUser = newUserSchema.safeParse(req.body);
    if (!newUser.success) {
      throw new AppError(
        400,
        'INVALID_REQUEST',
        'Registration data is missing or malformed',
      );
    }
    const result = await users.createUser(newUser.data);
    res.status(201).json(result);
  };

  const getById: RequestHandler = async (req, res) => {
    const id = idParamSchema.safeParse(req.params.id);
    if (!id.success) {
      throw new AppError(400, 'INVALID_ID', 'User ID is invalid');
    }
    const user = await users.getById(id.data);
    if (!user) {
      throw new AppError(
        404,
        'USER_NOT_FOUND',
        `User with id ${id.data} was not found`,
      );
    }
    res.json(user);
  };

  const getSelfById: RequestHandler = async (req, res) => {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'not authenticated');
    }
    const userId = z.coerce.number().int().positive().parse(req.user.id);
    const publicUser = await users.getById(userId);
    if (!publicUser) {
      throw new AppError(
        404,
        'USER_NOT_FOUND',
        'user with this id was not found',
      );
    }
    res.json(publicUser);
  };

  const getByUsername: RequestHandler = async (req, res) => {
    const username = z.string().safeParse(req.params.username);
    if (!username.success) {
      throw new AppError(
        400,
        'INVALID_USERNAME',
        'Username is invalid or request is malformed',
      );
    }
    const user = await users.getByUsername(username.data);
    if (!user) {
      throw new AppError(
        404,
        'USER_NOT_FOUND',
        `User with ${username.data} was not found`,
      );
    }
    res.json(user);
  };

  const getAllUser: RequestHandler = async (_req, res) => {
    const allUser = await users.getAllUser();
    res.json(allUser);
  };

  const updateSelf: RequestHandler = async (req, res) => {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'not authenticated');
    }
    const userId = z.coerce.number().int().positive().parse(req.user.id);
    const updateData = userSelfUpdateDataSchema.safeParse(req.body);
    if (!updateData.success) {
      throw new AppError(
        400,
        'INVALID_REQUEST',
        'fields are missing or invalid',
        z.flattenError(updateData.error).fieldErrors,
      );
    }
    const publicUser = await users.updateUser(userId, updateData.data);
    res.json(publicUser);
  };

  const updateSelfPassword: RequestHandler = async (req, res) => {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'not authenticated');
    }
    const userId = z.coerce.number().int().positive().parse(req.user.id);
    const passwordData = userPasswordUpdateDataSchema.safeParse(req.body);
    if (!passwordData.success) {
      throw new AppError(
        400,
        'INVALID_REQUEST',
        'fields are missing or invalid',
        z.flattenError(passwordData.error).fieldErrors,
      );
    }
    if (!passwordData.data.currentPassword) {
      throw new AppError(400, 'INVALID_REQUEST', 'current password is missing');
    }
    await users.updateSelfPasswordHash(
      userId,
      passwordData.data.currentPassword,
      passwordData.data.newPassword,
    );
    res.json({});
  };

  const updateUser: RequestHandler = async (req, res) => {
    const targetUserId = z.coerce
      .number()
      .int()
      .positive()
      .safeParse(req.params.id);
    if (!targetUserId.success) {
      throw new AppError(
        400,
        'INVALID_REQUEST',
        'userId is missing or malformed',
      );
    }
    const updateData = userUpdateDataSchema.safeParse(req.body);
    if (!updateData.success) {
      throw new AppError(
        400,
        'INVALID_REQUEST',
        'request data is missing or malformed',
      );
    }
    const publicUser = await users.updateUser(
      targetUserId.data,
      updateData.data,
    );
    res.json(publicUser);
  };

  const updateUserPassword: RequestHandler = async (req, res) => {
    const userId = z.coerce.number().int().positive().safeParse(req.params.id);
    const passwordData = userPasswordUpdateDataSchema.safeParse(req.body);
    if (!passwordData.success || !userId.success) {
      throw new AppError(
        400,
        'INVALID_REQUEST',
        'request data is missing or malformed',
      );
    }
    await users.updatePasswordHash(userId.data, passwordData.data.newPassword);
    res.json({});
  };

  const requestPasswordReset: RequestHandler = (req, res) => {
    const body = z
      .object({
        email: z.email(),
      })
      .safeParse(req.body);

    if (!body.success) {
      throw new AppError(
        400,
        'INVALID_REQUEST',
        'email is missing or malformed',
      );
    }

    res.json({});

    void users
      .requestSelfPasswordReset(body.data.email)
      .catch((error: unknown) => {
        req.log.error({ error }, 'password reset request failed');
      });
  };

  const resetPassword: RequestHandler = async (req, res) => {
    const resetData = passwordResetParamsSchema.safeParse(req.body);
    if (!resetData.success) {
      throw new AppError(
        400,
        'REQUEST_INVALID',
        'request data is missing or malformed',
      );
    }
    await users.resetSelfPassword(resetData.data);
    res.json({});
  };

  const setUserRoles: RequestHandler = async (req, res) => {
    const userId = z.coerce.number().int().positive().safeParse(req.params.id);

    if (!userId.success) {
      throw new AppError(
        400,
        'INVALID_REQUEST',
        'user id is missing or not a number',
      );
    }
    const roles = roleSchema.array().safeParse(req.body);

    if (!roles.success) {
      throw new AppError(
        400,
        'INVALID_REQUEST',
        'role set is either missing or malformed',
      );
    }

    const user = await users.setUserRoles(userId.data, roles.data);
    res.json(user);
  };

  return {
    registerUser,
    getById,
    getSelfById,
    getByUsername,
    getAllUser,
    updateSelf,
    updateSelfPassword,
    updateUser,
    updateUserPassword,
    setUserRoles,
    requestPasswordReset,
    resetPassword,
  };
}

export type UsersController = ReturnType<typeof createUserController>;

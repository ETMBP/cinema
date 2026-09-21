import { z } from 'zod';
import { type Role } from './roles.model.js';

export const permissionsSchema = z.enum([
  'movies:read',
  'movies:create',
  'movies:edit',
  'movies:delete',
  'votes:read',
  'votes:cast',
  'votes:manage',
  'users:read',
  'users:edit',
  'users:create',
  'users:delete',
  'roles:read',
  'roles:manage',
]);

export type Permission = z.infer<typeof permissionsSchema>;

export const rolePermissions: Record<Role, readonly Permission[]> = {
  user: ['movies:read', 'roles:read', 'votes:read', 'votes:cast'],
  editor: ['movies:edit', 'movies:create'],
  director: ['movies:delete', 'votes:manage', 'users:read'],
  admin: permissionsSchema.options,
};

export function can(roles: readonly Role[], permission: Permission): boolean {
  return roles.some((role) => rolePermissions[role].includes(permission));
}

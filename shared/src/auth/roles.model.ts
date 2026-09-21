// roles related schemas and models

import z from 'zod';

export const roleSchema = z.enum(['admin', 'director', 'editor', 'user']);
export type Role = z.infer<typeof roleSchema>;
export const roles = roleSchema.options;

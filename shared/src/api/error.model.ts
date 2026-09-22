//
import { z } from 'zod';

export const knownErrorCodeSchema = z.enum([
  'EMAIL_TAKEN',
  'FORBIDDEN',
  'INTERNAL',
  'INVALID_CREDENTIALS',
  'INVALID_TOKEN',
  'ROUTE_NOT_FOUND',
  'TOKEN_EXPIRED',
  'UNAUTHENTICATED',
  'USER_DISABLED',
  'USER_NOT_FOUND',
  'USERNAME_TAKEN',
  'VALIDATION',
  'WRONG_PASSWORD',
]);

export type ErrorCode = z.infer<typeof knownErrorCodeSchema>;

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
    requestId: z.string().optional(),
  }),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

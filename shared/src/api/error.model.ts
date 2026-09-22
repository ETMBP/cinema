//
import { z } from 'zod';

export const knownErrorCodes = [
  'VALIDATION',
  'INVALID_ID',
  'INVALID_CREDENTIALS',
  'USER_DISABLED',
  'ROUTE_NOT_FOUND',
  'INTERNAL',
];

export type KnownErrorCode = (typeof knownErrorCodes)[number];

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
    requestId: z.string().optional(),
  }),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

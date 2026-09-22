import z from 'zod';

export const refreshTokenRecordSchema = z.object({
  tokenId: z.uuid(),
  userId: z.number().int().positive(),
  expiresAt: z.coerce.date(),
});

export type RefreshTokenRecord = z.infer<typeof refreshTokenRecordSchema>;
export interface ITokenStore {
  save(record: RefreshTokenRecord): Promise<void>;
  find(tokenId: string): Promise<RefreshTokenRecord | undefined>;
  revoke(tokenId: string): Promise<void>;
  revokeAllForUser(userId: number): Promise<void>;
}

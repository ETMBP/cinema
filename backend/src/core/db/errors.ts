// Error model and parser specifically for SQL side errors

export interface DbError extends Error {
  code: string;
  errno?: number;
  sqlMessage?: string;
}

export function isDbError(err: unknown): err is DbError {
  return err instanceof Error && 'code' in err && typeof err.code === 'string';
}

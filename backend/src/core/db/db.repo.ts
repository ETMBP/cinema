import type { IDbOptions } from '#core/config.js';
import mysql, {
  type ResultSetHeader,
  type ExecuteValues,
  type Pool,
} from 'mysql2/promise';
import { z } from 'zod';

export type SqlParam = string | number | boolean | Date | Buffer | null;
export interface DbExecutor {
  queryRows<S extends z.ZodType>(
    schema: S,
    query: string,
    params?: SqlParam[],
  ): Promise<z.output<S>[]>;
  execute(query: string, params?: SqlParam[]): Promise<ResultSetHeader>;
}

type SqlRunner = Pick<Pool, 'execute'>;

function makeExecutor(runner: SqlRunner): DbExecutor {
  return {
    // All SQL query should go through this function
    // to return typed answer or fail with a zod error
    async queryRows<S extends z.ZodType>(
      schema: S,
      query: string,
      params: SqlParam[],
    ): Promise<z.output<S>[]> {
      const [rows] = await runner.execute(query, params);
      try {
        return z.array(schema).parse(rows);
      } catch (error) {
        throw new Error(`Failed to validate SQL response for query: ${query}`, {
          cause: error,
        });
      }
    },

    // Wrapper to execute inserts
    async execute(
      query: string,
      params: ExecuteValues[] = [],
    ): Promise<ResultSetHeader> {
      const [result] = await runner.execute<ResultSetHeader>(query, params);
      return result;
    },
  };
}

export class DbPool implements DbExecutor {
  readonly #pool: Pool;
  readonly #executor: DbExecutor;

  constructor(options: IDbOptions) {
    this.#pool = this.#createPool(options);
    this.#executor = makeExecutor(this.#pool);
  }

  #createPool(options: IDbOptions): Pool {
    return mysql.createPool({
      host: options.host,
      port: options.port,
      user: options.username,
      password: options.password,
      database: options.database,
      connectionLimit: 10,
      timezone: options.timezone,
    });
  }

  queryRows: DbExecutor['queryRows'] = (schema, query, params) =>
    this.#executor.queryRows(schema, query, params);

  execute: DbExecutor['execute'] = (query, params) =>
    this.#executor.execute(query, params);

  async withTransaction<T>(fn: (tx: DbExecutor) => Promise<T>): Promise<T> {
    const dbConn = await this.#pool.getConnection();

    try {
      await dbConn.beginTransaction();
      const result = await fn(makeExecutor(dbConn));
      await dbConn.commit();
      return result;
    } catch (error) {
      try {
        await dbConn.rollback();
      } catch {
        // the warehouse is on fire, keeping the original error
      }
      throw error;
    } finally {
      dbConn.release();
    }
  }

  // A test to check sql engine availability
  async verify(): Promise<void> {
    try {
      const conn = await this.#pool.getConnection();
      try {
        await conn.ping();
      } finally {
        conn.release();
      }
    } catch (error) {
      throw new Error('Database connection test failed', { cause: error });
    }
  }
  async end(): Promise<void> {
    await this.#pool.end();
  }
}

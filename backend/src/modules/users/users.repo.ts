import { AppError } from '#core/error.js';
import { DbPool, type DbExecutor } from '#core/db/db.repo.js';
import { isDbError } from '#core/db/errors.js';
import {
  roleRowSchema,
  userRowSchema,
  type NewUser,
  type RoleRow,
  type UserRow,
} from './users.model.js';
import type { ResultSetHeader } from 'mysql2';

export class UsersRepo {
  readonly #db: DbPool;

  constructor(db: DbPool) {
    this.#db = db;
  }

  async findById(id: number): Promise<UserRow | undefined> {
    const query = `SELECT u.id, u.username, u.password_hash AS passwordHash,
          u.email, u.is_enabled AS isEnabled, u.created,
          GROUP_CONCAT(r.name) AS roles
        FROM users u
        LEFT JOIN role_assignments ra ON ra.user_id = u.id
        LEFT JOIN roles r ON r.id = ra.role_id
      WHERE u.id = ?
      GROUP BY u.id`;
    const params = [id];
    const rows = await this.#db.queryRows(userRowSchema, query, params);
    return rows[0];
  }

  async findByUsername(username: string): Promise<UserRow | undefined> {
    const query = `SELECT u.id, u.username, u.password_hash AS passwordHash,
          u.email, u.is_enabled AS isEnabled, u.created,
          GROUP_CONCAT(r.name) AS roles
        FROM users u
        LEFT JOIN role_assignments ra ON ra.user_id = u.id
        LEFT JOIN roles r ON r.id = ra.role_id
      WHERE u.username = ?
      GROUP BY u.id`;
    const params = [username];
    const rows = await this.#db.queryRows(userRowSchema, query, params);
    return rows[0];
  }

  async findByEmail(email: string): Promise<UserRow | undefined> {
    const query = `SELECT u.id, u.username, u.password_hash AS passwordHash,
          u.email, u.is_enabled AS isEnabled, u.created,
          GROUP_CONCAT(r.name) AS roles
        FROM users u
        LEFT JOIN role_assignments ra ON ra.user_id = u.id
        LEFT JOIN roles r ON r.id = ra.role_id
      WHERE u.email = ?
      GROUP BY u.id`;
    const params = [email];
    const rows = await this.#db.queryRows(userRowSchema, query, params);
    return rows[0];
  }

  async findAllUser(): Promise<UserRow[] | undefined> {
    const query = `SELECT u.id, u.username, u.password_hash AS passwordHash,
          u.email, u.is_enabled AS isEnabled, u.created,
          GROUP_CONCAT(r.name) AS roles
        FROM users u
        LEFT JOIN role_assignments ra ON ra.user_id = u.id
        LEFT JOIN roles r ON r.id = ra.role_id
      GROUP BY u.id`;
    const rows = await this.#db.queryRows(userRowSchema, query);
    return rows;
  }

  async getUserRoles(id: number): Promise<RoleRow[]> {
    const query = `SELECT r.name, r.id
          FROM users u
          JOIN role_assignments ra ON u.id = ra.user_id
          JOIN roles r ON ra.role_id = r.id
          WHERE u.id = ?`;
    const params = [id];
    const roles = await this.#db.queryRows(roleRowSchema, query, params);
    return roles;
  }

  async newUser(
    user: NewUser,
    passwordHash: string,
    dbConn: DbExecutor = this.#db,
  ): Promise<ResultSetHeader> {
    const query = `INSERT INTO users
      (username, email, password_hash)
      VALUES (?, ?, ?)`;
    const params = [user.username, user.email, passwordHash];
    try {
      const result = await dbConn.execute(query, params);
      return result;
    } catch (error) {
      if (isDbError(error) && error.code === 'ER_DUP_ENTRY') {
        if (error.sqlMessage?.includes('uq_users_username')) {
          throw new AppError(
            409,
            'USERNAME_TAKEN',
            'Username is already taken',
          );
        }
        if (error.sqlMessage?.includes('uq_users_email')) {
          throw new AppError(409, 'EMAIL_TAKEN', 'Email is already taken');
        }
      }
      throw error;
    }
  }

  async deleteUser(userId: number): Promise<number> {
    const query = `DELETE FROM users
      WHERE id = ?`;
    const params = [userId];
    const result = await this.#db.execute(query, params);
    return result.affectedRows;
  }

  async getAllRoles(): Promise<RoleRow[] | undefined> {
    const query = `SELECT id, name FROM roles`;
    const result = await this.#db.queryRows(roleRowSchema, query);
    return result;
  }

  async getRoleByName(name: string): Promise<RoleRow | undefined> {
    const query = `SELECT id, name FROM roles
      WHERE name = ?`;
    const params = [name];
    const result = await this.#db.queryRows(roleRowSchema, query, params);
    return result[0];
  }

  async addUserRole(
    roleId: number,
    userId: number,
    dbConn: DbExecutor = this.#db,
  ): Promise<number> {
    const query = `INSERT INTO role_assignments (role_id, user_id) VALUES (?, ?)`;
    const params = [roleId, userId];
    const result = await dbConn.execute(query, params);
    return result.insertId;
  }

  async deleteUserRole(
    roleId: number,
    userId: number,
    dbConn: DbExecutor = this.#db,
  ): Promise<number> {
    const query = `DELETE FROM role_assignments
      WHERE role_id = ? && user_id = ?`;
    const params = [roleId, userId];
    const result = await dbConn.execute(query, params);
    return result.affectedRows;
  }

  async updatePasswordHash(
    userId: number,
    passwordHash: string,
  ): Promise<number> {
    const query = `UPDATE users SET password_hash = ? 
      WHERE id = ?`;
    const params = [passwordHash, userId];
    const result = await this.#db.execute(query, params);
    return result.affectedRows;
  }

  async updateEmail(userId: number, email: string): Promise<number> {
    const query = `UPDATE users SET email = ?
      WHERE id = ?`;
    const params = [email, userId];
    const result = await this.#db.execute(query, params);
    return result.affectedRows;
  }

  async updateEnabled(userId: number, isEnabled: boolean): Promise<number> {
    const query = `UPDATE users SET is_enabled = ?
      WHERE id = ?`;
    const params = [isEnabled, userId];
    const result = await this.#db.execute(query, params);
    return result.affectedRows;
  }
}

import type { DbExecutor, DbPool, SqlParam } from '#core/db/db.repo.js';
import type {
  MovieInput,
  MovieListQuery,
  MovieUpdateInput,
} from '@cinema/shared';
import { movieRowScheme, type MovieRow } from './movies.model.js';
import type { ResultSetHeader } from 'mysql2';
import z from 'zod';

const SORT_COLUMNS: Record<MovieListQuery['sort'], string> = {
  title: 'm.title',
  year: 'm.year',
  addedWhen: 'm.added_when',
  addedBy: 'u.username',
};

const MOVIE_SELECT = `SELECT m.id, m.title, m.year, m.is_watched AS isWatched, m.is_downloaded AS isDownloaded, m.imdb_url AS imdbUrl, u.username AS addedBy, m.added_when AS addedWhen
      FROM movies AS m
      LEFT JOIN users AS u ON u.id = m.added_by`;

export class MoviesRepo {
  readonly #db: DbPool;

  constructor(db: DbPool) {
    this.#db = db;
  }

  async findById(id: number): Promise<MovieRow | undefined> {
    const query = `${MOVIE_SELECT} WHERE m.id = ?`;
    const params = [id];

    const rows = await this.#db.queryRows(movieRowScheme, query, params);
    return rows[0];
  }

  async findAll(): Promise<MovieRow[]> {
    const rows = await this.#db.queryRows(movieRowScheme, MOVIE_SELECT);
    return rows;
  }

  async list(
    queryInput: MovieListQuery,
  ): Promise<{ rows: MovieRow[]; total: number }> {
    const conditions: string[] = [];
    const queryParams: SqlParam[] = [];
    const escapeLike = (s: string) => s.replace(/[\\%_]/g, '\\$&');

    if (queryInput.search !== undefined) {
      conditions.push('m.title LIKE ?');
      queryParams.push(`%${escapeLike(queryInput.search)}%`);
    }

    if (queryInput.isWatched !== undefined) {
      conditions.push('m.is_watched = ?');
      queryParams.push(queryInput.isWatched ? 1 : 0);
    }

    if (queryInput.isDownloaded !== undefined) {
      conditions.push('m.is_downloaded = ?');
      queryParams.push(queryInput.isDownloaded ? 1 : 0);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderBy = `${SORT_COLUMNS[queryInput.sort]} ${queryInput.order === 'asc' ? 'ASC' : 'DESC'}, m.id ASC`;
    const offset = (queryInput.page - 1) * queryInput.pageSize;
    const query = `${MOVIE_SELECT} ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`;

    const rows = await this.#db.queryRows(movieRowScheme, query, [
      ...queryParams,
      queryInput.pageSize,
      offset,
    ]);

    const [count] = await this.#db.queryRows(
      z.object({ total: z.number() }),
      `SELECT COUNT(*) AS total FROM movies AS m ${where}`,
      queryParams,
    );

    return { rows, total: count.total };
  }

  async delete(id: number): Promise<number> {
    const query = `DELETE FROM movies WHERE id = ?`;
    const params = [id];

    const result = await this.#db.execute(query, params);
    return result.affectedRows;
  }

  async newMovie(movie: MovieInput, userId: number): Promise<ResultSetHeader> {
    const query = `INSERT INTO movies 
      (title, year, is_watched, is_downloaded, added_by, imdb_url)
      VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [
      movie.title,
      movie.year,
      movie.isWatched,
      movie.isDownloaded,
      userId,
      movie.imdbUrl ?? null,
    ];
    const result = await this.#db.execute(query, values);

    return result;
  }

  async updateMovie(id: number, d: MovieUpdateInput): Promise<void> {
    const columns: string[] = [];
    const params: SqlParam[] = [];

    if (d.title) {
      columns.push('title');
      params.push(d.title);
    }
    if (d.year) {
      columns.push('year');
      params.push(d.year);
    }
    if (d.isWatched !== undefined) {
      columns.push('is_watched');
      params.push(d.isWatched);
    }
    if (d.isDownloaded !== undefined) {
      columns.push('is_downloaded');
      params.push(d.isDownloaded);
    }
    if (d.imdbUrl !== undefined) {
      columns.push('imdb_url');
      params.push(d.imdbUrl);
    }

    const query = `UPDATE movies SET ${columns.join(' = ?, ')} = ? WHERE id = ?`;
    await this.#db.execute(query, [...params, id]);
  }

  async updateTitle(
    id: number,
    title: string,
    dbConn: DbExecutor = this.#db,
  ): Promise<void> {
    const query = `UPDATE movies SET title = ? WHERE id = ?`;
    const params = [title, id];

    await dbConn.execute(query, params);
  }

  async updateYear(
    id: number,
    year: number,
    dbConn: DbExecutor = this.#db,
  ): Promise<void> {
    const query = `UPDATE movies SET year = ? WHERE id = ?`;
    const params = [year, id];

    await dbConn.execute(query, params);
  }

  async updateIsWatched(
    id: number,
    isWatched: boolean,
    dbConn: DbExecutor = this.#db,
  ): Promise<void> {
    const query = `UPDATE movies SET is_watched = ? WHERE id = ?`;
    const params = [isWatched, id];

    await dbConn.execute(query, params);
  }

  async updateIsDownloaded(
    id: number,
    isDownloaded: boolean,
    dbConn: DbExecutor = this.#db,
  ): Promise<void> {
    const query = `UPDATE movies SET is_downloaded = ? WHERE id = ?`;
    const params = [isDownloaded, id];

    await dbConn.execute(query, params);
  }

  async updateImdbUrl(
    id: number,
    imdbUrl: string | null,
    dbConn: DbExecutor = this.#db,
  ): Promise<void> {
    const query = `UPDATE movies SET imdb_url = ? WHERE id = ?`;
    const params = [imdbUrl, id];

    await dbConn.execute(query, params);
  }
}

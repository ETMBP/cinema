import type { DbPool } from '#core/db/db.repo.js';
import type { MovieInput } from '@cinema/shared';
import { movieRowScheme, type MovieRow } from './movies.model.js';
import type { ResultSetHeader } from 'mysql2';

export class MovieRepo {
  readonly #db: DbPool;

  constructor(db: DbPool) {
    this.#db = db;
  }

  async findById(id: number): Promise<MovieRow | undefined> {
    const query = `SELECT m.id, m.title, m.year, m.is_watched AS isWatched, m.is_downloaded AS isDownloaded, m.imdb_url AS imdbUrl, u.username AS addedBy, m.added_when AS addedWhen
      FROM movies AS m
      LEFT JOIN users AS u ON u.id = m.added_by
      WHERE m.id = ?`;
    const params = [id];

    const rows = await this.#db.queryRows(movieRowScheme, query, params);
    return rows[0];
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
}

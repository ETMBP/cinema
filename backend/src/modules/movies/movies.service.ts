import {
  publicMovieSchema,
  type MovieInput,
  type PublicMovie,
} from '@cinema/shared';
import type { MovieRepo } from './movies.repo.js';
import { AppError } from '#core/error.js';

export class MoviesService {
  readonly #repo: MovieRepo;

  constructor(movieRepo: MovieRepo) {
    this.#repo = movieRepo;
  }

  async getById(id: number): Promise<PublicMovie | undefined> {
    const result = await this.#repo.findById(id);
    return publicMovieSchema.parse(result);
  }

  async newMovie(movie: MovieInput, userId: number): Promise<PublicMovie> {
    const result = await this.#repo.newMovie(movie, userId);
    const addedMovie = await this.#repo.findById(result.insertId);

    if (!addedMovie) {
      throw new AppError(
        500,
        'INTERNAL',
        'adding new movie db backend silently failed',
      );
    }

    return publicMovieSchema.parse(addedMovie);
  }
}

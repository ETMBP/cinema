import {
  publicMovieSchema,
  type MovieInput,
  type PublicMovie,
} from '@cinema/shared';
import type { MoviesRepo } from './movies.repo.js';

export class MoviesService {
  readonly #repo: MoviesRepo;

  constructor(movieRepo: MoviesRepo) {
    this.#repo = movieRepo;
  }

  async getById(id: number): Promise<PublicMovie | undefined> {
    const result = await this.#repo.findById(id);
    return result ? publicMovieSchema.parse(result) : undefined;
  }

  async newMovie(movie: MovieInput, userId: number): Promise<PublicMovie> {
    const result = await this.#repo.newMovie(movie, userId);
    const addedMovie = await this.#repo.findById(result.insertId);

    if (!addedMovie) {
      throw new Error('adding new movie db backend silently failed');
    }

    return publicMovieSchema.parse(addedMovie);
  }
}

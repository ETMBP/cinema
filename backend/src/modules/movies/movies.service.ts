import {
  publicMovieSchema,
  type MovieInput,
  type MovieListQuery,
  type MovieListResponse,
  type MovieUpdateInput,
  type PublicMovie,
} from '@cinema/shared';
import type { MoviesRepo } from './movies.repo.js';
import z from 'zod';
import { AppError } from '#core/error.js';

export class MoviesService {
  readonly #repo: MoviesRepo;

  constructor(moviesRepo: MoviesRepo) {
    this.#repo = moviesRepo;
  }

  async getById(id: number): Promise<PublicMovie | undefined> {
    const result = await this.#repo.findById(id);
    return result ? publicMovieSchema.parse(result) : undefined;
  }

  async getList(queryInput: MovieListQuery): Promise<MovieListResponse> {
    const { rows, total } = await this.#repo.list(queryInput);

    return { items: z.array(publicMovieSchema).parse(rows), total };
  }

  async newMovie(movie: MovieInput, userId: number): Promise<PublicMovie> {
    const result = await this.#repo.newMovie(movie, userId);
    const addedMovie = await this.#repo.findById(result.insertId);

    if (!addedMovie) {
      throw new Error('adding new movie db backend silently failed');
    }

    return publicMovieSchema.parse(addedMovie);
  }

  async deleteMovie(id: number): Promise<void> {
    await this.#repo.delete(id);
  }

  async updateMovie(id: number, data: MovieUpdateInput): Promise<PublicMovie> {
    const movie = await this.#repo.findById(id);
    if (!movie) {
      throw new AppError(
        404,
        'MOVIE_NOT_FOUND',
        'a movie with this ID does not exist',
      );
    }

    await this.#repo.updateMovie(id, data);

    const updatedMovie = await this.#repo.findById(id);

    if (!updatedMovie) {
      throw new AppError(
        404,
        'MOVIE_NOT_FOUND',
        'movie was deleted during the operation',
      );
    }

    return publicMovieSchema.parse(updatedMovie);
  }
}

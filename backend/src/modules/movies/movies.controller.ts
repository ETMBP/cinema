import type { RequestHandler } from 'express';
import type { MoviesService } from './movies.service.js';
import z from 'zod';
import { AppError } from '#core/error.js';
import { movieInputSchema } from '@cinema/shared';

export function createMoviesController(service: MoviesService) {
  const getById: RequestHandler = async (req, res) => {
    const id = z.coerce.number().int().positive().safeParse(req.params.id);
    if (!id.success) {
      throw new AppError(400, 'VALIDATION', 'id is missing or not a number');
    }
    const movie = await service.getById(id.data);

    if (!movie) {
      throw new AppError(
        404,
        'MOVIE_NOT_FOUND',
        'movie does not exist with this ID',
      );
    }

    res.json(movie);
  };

  const createMovie: RequestHandler = async (req, res) => {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHENTICATED', 'not authenticated');
    }
    const userId = req.user.id;
    const movieData = movieInputSchema.safeParse(req.body);
    if (!movieData.success) {
      throw new AppError(400, 'VALIDATION', 'rquest is invalid or malformed');
    }

    const createdMovie = await service.newMovie(movieData.data, userId);
    res.status(201).json(createdMovie);
  };

  return { getById, createMovie };
}

export type MoviesController = ReturnType<typeof createMoviesController>;

import type { RequestHandler } from 'express';
import type { MoviesService } from './movies.service.js';
import z from 'zod';
import { AppError } from '#core/error.js';
import {
  movieInputSchema,
  movieListQuerySchema,
  movieUpdateInputSchema,
} from '@cinema/shared';

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

  const getList: RequestHandler = async (req, res) => {
    const queryInput = movieListQuerySchema.safeParse(req.query);

    if (!queryInput.success) {
      throw new AppError(
        400,
        'VALIDATION',
        'search query is missing or malformed',
        z.flattenError(queryInput.error).fieldErrors,
      );
    }

    const result = await service.getList(queryInput.data);

    res.json(result);
  };

  const createMovie: RequestHandler = async (req, res) => {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHENTICATED', 'not authenticated');
    }
    const userId = req.user.id;
    const movieData = movieInputSchema.safeParse(req.body);
    if (!movieData.success) {
      throw new AppError(400, 'VALIDATION', 'request is invalid or malformed');
    }

    const createdMovie = await service.newMovie(movieData.data, userId);
    res.status(201).json(createdMovie);
  };

  const updateMovie: RequestHandler = async (req, res) => {
    const id = z.coerce.number().int().positive().safeParse(req.params.id);
    if (!id.success) {
      throw new AppError(400, 'VALIDATION', 'id is missing or not a number');
    }

    const updateData = movieUpdateInputSchema.safeParse(req.body);
    if (!updateData.success) {
      throw new AppError(
        400,
        'VALIDATION',
        'update data is missing or malformed',
      );
    }

    const updatedMovie = await service.updateMovie(id.data, updateData.data);

    res.json(updatedMovie);
  };

  return { getById, getList, createMovie, updateMovie };
}

export type MoviesController = ReturnType<typeof createMoviesController>;

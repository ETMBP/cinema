import z from 'zod';

export const publicMovieSchema = z.object({
  id: z.coerce.number().int().positive(),
  title: z.string().min(1),
  year: z.coerce.number().int().positive(),
  isWatched: z.boolean(),
  isDownloaded: z.boolean(),
  imdbUrl: z.string().nullish(),
  addedBy: z.string(),
  addedWhen: z.coerce.date(),
});

export type PublicMovie = z.infer<typeof publicMovieSchema>;

export const movieInputSchema = z.object({
  title: z.string().min(1).max(255),
  year: z.number().int().positive(),
  isWatched: z.boolean(),
  isDownloaded: z.boolean(),
  imdbUrl: z.string().max(255).nullish(),
});

export type MovieInput = z.infer<typeof movieInputSchema>;

export const movieUpdateInputSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  year: z.number().int().positive().optional(),
  isWatched: z.boolean().optional(),
  isDownloaded: z.boolean().optional(),
  imdbUrl: z.string().max(255).nullish(),
});

export type MovieUpdateInput = z.infer<typeof movieUpdateInputSchema>;

const sortTerms = ['title', 'year', 'addedWhen', 'addedBy'] as const;
const queryBool = z.enum(['true', 'false']).transform((v) => v === 'true');

export const movieListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(sortTerms).default('title'),
  order: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().trim().min(1).max(100).optional(),
  isDownloaded: queryBool.optional(),
  isWatched: queryBool.optional(),
});

export type MovieListQuery = z.infer<typeof movieListQuerySchema>;

export const movieListResponseSchema = z.object({
  items: z.array(publicMovieSchema),
  total: z.number().int().nonnegative(),
});

export type MovieListResponse = z.infer<typeof movieListResponseSchema>;

import z from 'zod';

export const publicMovieSchema = z.object({
  id: z.coerce.number().int().positive(),
  title: z.string().min(1),
  year: z.coerce.number().int().positive(),
  isWatched: z.boolean(),
  isDownloaded: z.boolean(),
  imdbUrl: z.string().optional(),
  addedBy: z.string(),
  addedWhen: z.coerce.date(),
});

export type PublicMovie = z.infer<typeof publicMovieSchema>;

export const movieInputSchema = z.object({
  title: z.string().min(1),
  year: z.coerce.number().int().positive(),
  isWatched: z.boolean(),
  isDownloaded: z.boolean(),
  imdbUrl: z.string().nullish(),
});

export type MovieInput = z.infer<typeof movieInputSchema>;

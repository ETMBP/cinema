import type { Router } from 'express';
import z from 'zod';

export interface MoviesModule {
  router: Router;
}

export const movieRowScheme = z.object({
  id: z.coerce.number().positive().int(),
  title: z.string(),
  year: z.coerce.number().positive().int(),
  isWatched: z
    .number()
    .int()
    .min(0)
    .max(1)
    .transform((v) => v === 1),
  isDownloaded: z
    .number()
    .int()
    .min(0)
    .max(1)
    .transform((v) => v === 1),
  imdbUrl: z.string().nullable(),
  addedBy: z.string(),
  addedWhen: z.coerce.date(),
});

export type MovieRow = z.infer<typeof movieRowScheme>;

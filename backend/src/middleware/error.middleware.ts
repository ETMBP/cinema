import { AppError } from '#core/error.js';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { ErrorResponse } from '@cinema/shared';

export const notFoundHandler: RequestHandler = (req, res) => {
  const body: ErrorResponse = {
    error: {
      message: `No route for ${req.method} ${req.path}`,
      code: 'ROUTE_NOT_FOUND',
    },
  };
  res.status(404).json(body);
};

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof AppError) {
    req.log.info({ code: err.code }, err.message);
    const body: ErrorResponse = {
      error: {
        message: err.message,
        code: err.code,
        details: err.details,
      },
    };
    return res.status(err.statusCode).json(body);
  }

  req.log.error({ err }, 'unhandled error');
  const requestId =
    typeof req.id === 'string' || typeof req.id === 'number'
      ? String(req.id)
      : undefined;
  const body: ErrorResponse = {
    error: {
      message: 'Internal Server Error',
      code: 'INTERNAL',
      requestId: requestId,
    },
  };
  res.status(500).json(body);
};

import pino, { type Logger } from 'pino';

export function createLogger(logLevel: string, isProduction: boolean): Logger {
  return pino({
    level: logLevel,
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: [
      'req.headers.authorization',
      'user.passwordHash',
      'user.password_hash',
    ],
    transport: isProduction ? undefined : { target: 'pino-pretty' },
  });
}

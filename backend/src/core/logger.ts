import pino, { type Logger } from 'pino';

export function createLogger(logLevel: string): Logger {
  return pino({
    level: logLevel,
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: [
      'req.headers.authorization',
      'user.passwordHash',
      'user.password_hash',
    ],
    transport: {
      target: 'pino-pretty',
      options: { destination: 1 },
    },
  });
}

// BACKEND
//
// Entrypoint

import { Server } from '#core/server.js';

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception: ', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection: ', err);
  process.exit(1);
});

const server = new Server();

// Handling container shutdown
const shutdown = () => {
  server.stop().catch((err: unknown) => {
    console.error('Graceful shutdown failed:', err);
    process.exit(1);
  });
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

//Starting the server process, exiting if error happens during init
try {
  await server.start();
} catch (error) {
  console.error(
    'Startup failed: ',
    error instanceof Error ? error.message : error,
  );
  if (error instanceof Error && error.cause !== undefined) {
    console.error('Caused by: ', error.cause);
  }
  process.exit(1);
}

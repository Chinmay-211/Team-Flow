import app from './app';
import { env } from './config/env';
import logger from './config/logger';

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 TeamFlow Backend API listening on port ${env.PORT} [${env.NODE_ENV}]`);
});

process.on('unhandledRejection', (err: any) => {
  logger.error('Unhandled Promise Rejection:', err);
});

process.on('uncaughtException', (err: any) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

export default server;

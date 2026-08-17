import { PrismaClient } from '@prisma/client';
import logger from './logger';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
});

prisma.$connect()
  .then(() => logger.info('Connected to PostgreSQL via Prisma'))
  .catch((err) => logger.error('PostgreSQL connection error:', err));

export default prisma;

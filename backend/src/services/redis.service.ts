import { createClient } from 'redis';
import { env } from '../config/env';
import logger from '../config/logger';

let client: ReturnType<typeof createClient> | null = null;
let isConnected = false;

try {
  client = createClient({ url: env.REDIS_URL });
  client.on('error', (err) => {
    logger.warn('Redis client connection error (falling back to direct DB/no-cache execution):', err.message);
    isConnected = false;
  });
  client.on('connect', () => {
    logger.info('Connected to Redis server');
    isConnected = true;
  });
  client.connect().catch((err) => {
    logger.warn('Redis connection attempt failed:', err.message);
    isConnected = false;
  });
} catch (e: any) {
  logger.warn('Redis initialization skipped:', e.message);
}

export class RedisService {
  static async get<T>(key: string): Promise<T | null> {
    if (!client || !isConnected) return null;
    try {
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.warn(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  static async set(key: string, value: any, ttlSeconds: number = 60): Promise<void> {
    if (!client || !isConnected) return;
    try {
      await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
    } catch (error) {
      logger.warn(`Redis SET error for key ${key}:`, error);
    }
  }

  static async del(keyPattern: string): Promise<void> {
    if (!client || !isConnected) return;
    try {
      const keys = await client.keys(keyPattern);
      if (keys.length > 0) {
        await client.del(keys);
      }
    } catch (error) {
      logger.warn(`Redis DEL error for pattern ${keyPattern}:`, error);
    }
  }

  static async invalidateDashboard(userId?: string): Promise<void> {
    if (userId) {
      await this.del(`dashboard:user:${userId}`);
    } else {
      await this.del('dashboard:user:*');
    }
  }

  static async invalidateSearch(): Promise<void> {
    await this.del('search:*');
  }

  static async invalidateNotifications(userId: string): Promise<void> {
    await this.del(`notifications:user:${userId}`);
  }
}

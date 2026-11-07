import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      this.logger.log('Redis disabled: REDIS_URL not configured');
      return;
    }

    try {
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        retryStrategy: (times) => {
          if (times > 2) {
            return null; // Stop retrying and degrade gracefully
          }
          return 500;
        },
      });

      await this.client.connect();
      this.isConnected = true;
      this.logger.log('Redis connection established successfully');
    } catch (error: any) {
      this.logger.warn(`Redis connection failed: ${error.message}. Degrading gracefully.`);
      this.client = null;
    }
  }

  getClient(): Redis | null {
    return this.isConnected ? this.client : null;
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        // Ignore disconnect errors on shutdown
      }
    }
  }
}


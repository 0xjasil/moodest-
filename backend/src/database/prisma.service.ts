import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const PRODUCTION_HOST_KEYWORD = 'ep-dark-bar-be07z5n9';

function extractNormalizedHost(url?: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return (parsed.hostname || '').replace('-pooler', '').toLowerCase();
  } catch {
    return '';
  }
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const isTest = process.env.NODE_ENV === 'test';
    const testUrl = process.env.TEST_DATABASE_URL?.trim();

    if (isTest) {
      if (!testUrl) {
        throw new Error(
          'FATAL DATABASE GUARD: NODE_ENV=test requires TEST_DATABASE_URL to be set. Refusing fallback to DATABASE_URL.',
        );
      }
      const testHost = extractNormalizedHost(testUrl);
      if (testHost.includes(PRODUCTION_HOST_KEYWORD)) {
        throw new Error(
          `FATAL DATABASE GUARD: TEST_DATABASE_URL points to the production database host (${testHost}). Aborting connection.`,
        );
      }
    }

    super(
      isTest
        ? {
            datasources: {
              db: {
                url: testUrl!,
              },
            },
          }
        : undefined,
    );

    if (isTest) {
      this.logger.log('PrismaService initialized with isolated TEST_DATABASE_URL');
    }
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('PostgreSQL database connected via Prisma');
    } catch (error) {
      this.logger.warn('Initial database connection failed, retrying in 2s (waking serverless pooler)...');
      try {
        await new Promise((r) => setTimeout(r, 2000));
        await this.$connect();
        this.logger.log('PostgreSQL database connected via Prisma on retry');
      } catch (retryError) {
        this.logger.error('Failed to connect to PostgreSQL database on startup', retryError);
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('PostgreSQL database disconnected cleanly');
  }
}

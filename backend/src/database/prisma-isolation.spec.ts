import { PrismaService } from './prisma.service';

describe('Database Isolation and Test Guard Safeguards', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('fails fast when NODE_ENV=test and TEST_DATABASE_URL is missing', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.TEST_DATABASE_URL;

    expect(() => new PrismaService()).toThrow(
      /FATAL DATABASE GUARD: NODE_ENV=test requires TEST_DATABASE_URL to be set/,
    );
  });

  it('fails fast when TEST_DATABASE_URL points to the production database host', () => {
    process.env.NODE_ENV = 'test';
    process.env.TEST_DATABASE_URL =
      'postgresql://user:pass@ep-dark-bar-be07z5n9-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require';

    expect(() => new PrismaService()).toThrow(
      /FATAL DATABASE GUARD: TEST_DATABASE_URL points to the production database host/,
    );
  });

  it('instantiates cleanly with an isolated test database url', () => {
    process.env.NODE_ENV = 'test';
    process.env.TEST_DATABASE_URL =
      'postgresql://user:pass@ep-isolated-test-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require';

    expect(() => new PrismaService()).not.toThrow();
  });
});


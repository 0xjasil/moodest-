import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env explicitly for all Jest workers and test suites
dotenv.config({ path: path.resolve(__dirname, '../.env') });

process.env.NODE_ENV = 'test';

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

const testUrl = process.env.TEST_DATABASE_URL?.trim();
const originalMainUrl = process.env.DATABASE_URL?.trim();

if (!testUrl) {
  throw new Error(
    'FATAL TEST SETUP ABORT: NODE_ENV is "test" but TEST_DATABASE_URL is missing in .env. Refusing to run tests without dedicated test database.',
  );
}

const testHost = extractNormalizedHost(testUrl);
const mainHost = extractNormalizedHost(originalMainUrl);

// Strict check 1: TEST_DATABASE_URL must never point to the production database
if (testHost.includes(PRODUCTION_HOST_KEYWORD)) {
  throw new Error(
    `FATAL TEST SETUP ABORT: TEST_DATABASE_URL points to the production database (${testHost}). Aborting immediately.`,
  );
}

// Strict check 2: If main URL points to production, test URL must not equal main URL
if (mainHost.includes(PRODUCTION_HOST_KEYWORD) && testHost === mainHost) {
  throw new Error(
    `FATAL TEST SETUP ABORT: TEST_DATABASE_URL equals production DATABASE_URL (${testHost}). Aborting immediately.`,
  );
}

// Safely propagate test database configuration across the test environment and child processes
process.env.DATABASE_URL = testUrl;
if (process.env.TEST_DIRECT_DATABASE_URL) {
  process.env.DIRECT_DATABASE_URL = process.env.TEST_DIRECT_DATABASE_URL;
}
process.env.__TEST_ENV_PROPAGATED__ = 'true';

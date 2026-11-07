import * as dotenv from 'dotenv';
dotenv.config();

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/modules/auth/auth.service';
import { PrismaService } from '../src/database/prisma.service';
import { Role } from '../src/common/constants';
import * as crypto from 'crypto';

const testDbUrl = process.env.TEST_DATABASE_URL?.trim();
const runIntegration = Boolean(testDbUrl);

// Skipped unless TEST_DATABASE_URL is set. Fail-fast if invoked on production database.
const describeIntegration = runIntegration ? describe : describe.skip;

jest.setTimeout(30000);

describeIntegration('Auth Refresh Token Concurrency & Reuse (Real Database E2E)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let prisma: PrismaService;
  let testUserId: string;

  beforeAll(async () => {
    if (!testDbUrl) {
      throw new Error(
        'GUARD VIOLATION: Refusing to run real database auth concurrency tests without TEST_DATABASE_URL set.',
      );
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    authService = app.get<AuthService>(AuthService);
    prisma = app.get<PrismaService>(PrismaService);

    // Create unique test user for concurrency tests
    const uniqueEmail = `concurrency_test_${Date.now()}@moodest-test.internal`;
    const user = await prisma.user.create({
      data: {
        email: uniqueEmail,
        passwordHash: '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012',
        role: Role.CUSTOMER,
        isActive: true,
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    if (testUserId && prisma) {
      // Clean up test data
      await prisma.refreshToken.deleteMany({ where: { userId: testUserId } });
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    }
    if (app) {
      await app.close();
    }
  });

  async function createInitialRefreshToken(family = crypto.randomUUID()): Promise<{ rawToken: string; family: string }> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        userId: testUserId,
        tokenHash,
        family,
        expiresAt,
      },
    });

    return { rawToken, family };
  }

  describe('Race Condition Protection (Database-Level Atomic Conditional Updates)', () => {
    it('2 parallel refreshes with identical token: exactly ONE wins, ONE is rejected', async () => {
      const { rawToken } = await createInitialRefreshToken();

      const results = await Promise.allSettled([
        authService.refresh(rawToken),
        authService.refresh(rawToken),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);

      const rejectedReason = (rejected[0] as PromiseRejectedResult).reason;
      expect(rejectedReason.message).toMatch(
        /Refresh token already used|Invalid refresh token|Token reuse detected/i,
      );
    });

    it('5 parallel refreshes with identical token: exactly ONE wins, 4 are rejected', async () => {
      const { rawToken } = await createInitialRefreshToken();

      const results = await Promise.allSettled([
        authService.refresh(rawToken),
        authService.refresh(rawToken),
        authService.refresh(rawToken),
        authService.refresh(rawToken),
        authService.refresh(rawToken),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(4);
    });
  });

  describe('Token Reuse Detection & Family Revocation', () => {
    it('presenting an already-revoked token revokes all active tokens in that family', async () => {
      const family = crypto.randomUUID();
      const token1 = await createInitialRefreshToken(family);

      // Successfully rotate token1 -> issues token2
      const rotateRes = await authService.refresh(token1.rawToken);
      const token2Raw = rotateRes.data.refreshToken;

      // Verify token2 is active in the family
      const token2Hash = crypto.createHash('sha256').update(token2Raw).digest('hex');
      const token2RecordBefore = await prisma.refreshToken.findUnique({
        where: { tokenHash: token2Hash },
      });
      expect(token2RecordBefore?.revokedAt).toBeNull();

      // Attacker replays revoked token1:
      await expect(authService.refresh(token1.rawToken)).rejects.toThrow(
        /Token reuse detected/i,
      );

      // Assert from a fresh query on the database that EVERY token in the family has revokedAt set
      const allTokensInFamily = await prisma.refreshToken.findMany({
        where: { family },
      });
      expect(allTokensInFamily.length).toBeGreaterThanOrEqual(2);
      for (const t of allTokensInFamily) {
        expect(t.revokedAt).not.toBeNull();
      }
    });
  });
});


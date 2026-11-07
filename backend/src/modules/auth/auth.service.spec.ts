import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PrismaService } from '../../database/prisma.service';
import { MAIL_SERVICE, IMailService } from './mail.service';
import { Role } from '../../common/constants';

jest.mock('bcrypt', () => {
  const actual = jest.requireActual('bcrypt');
  return {
    ...actual,
    compare: jest.fn((...args: any[]) => actual.compare(...args)),
  };
});

describe('AuthService (Unit Tests)', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;
  let mailService: jest.Mocked<IMailService>;

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn((cb: any) => cb(prisma)),
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      refreshToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      passwordResetToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-access-token'),
    };

    mailService = {
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    };

    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'auth.jwtAccessExpiresIn') return '15m';
        if (key === 'auth.jwtRefreshExpiresIn') return '30d';
        return undefined;
      }),
      getOrThrow: jest.fn((key: string) => {
        if (key === 'auth.jwtSecret') return 'test-jwt-secret-key-32-chars-long!';
        if (key === 'auth.jwtRefreshSecret') return 'test-jwt-refresh-secret-32-chars!';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: MAIL_SERVICE, useValue: mailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('1. Register', () => {
    it('forces role to CUSTOMER regardless of input and creates account with hashed password', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }: any) => ({
        id: 'u-1',
        email: data.email,
        name: data.name,
        role: data.role,
        isActive: data.isActive,
        createdAt: new Date(),
      }));
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt-1' });

      const res = await service.register({
        email: 'customer@test.com',
        password: 'Password123!',
        name: 'Jane Doe',
      });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'customer@test.com',
            role: Role.CUSTOMER,
            isActive: true,
          }),
        }),
      );
      expect(res.data.user.role).toBe(Role.CUSTOMER);
      expect((res.data.user as any).passwordHash).toBeUndefined();
      expect((res.data.user as any).password).toBeUndefined();
      expect(res.data.accessToken).toBe('mock-jwt-access-token');
      expect(res.data.refreshToken).toBeDefined();
    });

    it('rejects duplicate email with ConflictException', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing-id', email: 'taken@test.com' });

      await expect(
        service.register({
          email: 'taken@test.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('enforces MaxLength(72) on password in RegisterDto', async () => {
      // 72-char password that satisfies complexity: 'A' + 'a' + '1' + '!' + 68 chars
      const valid72 = 'Aa1!' + 'x'.repeat(68);
      const invalid73 = 'Aa1!' + 'x'.repeat(69);

      const validDto = plainToInstance(RegisterDto, {
        email: 'len72@test.com',
        password: valid72,
      });
      const validErrors = await validate(validDto);
      expect(validErrors.filter((e) => e.property === 'password')).toHaveLength(0);

      const invalidDto = plainToInstance(RegisterDto, {
        email: 'len73@test.com',
        password: invalid73,
      });
      const invalidErrors = await validate(invalidDto);
      const pwError = invalidErrors.find((e) => e.property === 'password');
      expect(pwError).toBeDefined();
      expect(pwError?.constraints?.maxLength).toContain('72 characters');
    });
  });

  describe('2. Login', () => {
    it('authenticates active user with correct password and updates lastLoginAt', async () => {
      const passwordHash = await bcrypt.hash('CorrectPassword123!', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 'u-2',
        email: 'user@test.com',
        passwordHash,
        name: 'John',
        role: Role.CUSTOMER,
        isActive: true,
      });
      prisma.user.update.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt-2' });

      const res = await service.login({
        email: 'user@test.com',
        password: 'CorrectPassword123!',
      });

      expect(res.data.accessToken).toBe('mock-jwt-access-token');
      expect(res.data.refreshToken).toBeDefined();
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u-2' },
          data: expect.objectContaining({ lastLoginAt: expect.any(Date) }),
        }),
      );
      expect((res.data.user as any).passwordHash).toBeUndefined();
    });

    it('rejects wrong password with generic UnauthorizedException("Invalid credentials")', async () => {
      const passwordHash = await bcrypt.hash('CorrectPassword123!', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 'u-2',
        email: 'user@test.com',
        passwordHash,
        isActive: true,
      });

      await expect(
        service.login({
          email: 'user@test.com',
          password: 'WrongPassword999!',
        }),
      ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));
    });

    it('rejects inactive user with UnauthorizedException("User account is inactive")', async () => {
      const passwordHash = await bcrypt.hash('CorrectPassword123!', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 'u-3',
        email: 'inactive@test.com',
        passwordHash,
        isActive: false,
      });

      await expect(
        service.login({
          email: 'inactive@test.com',
          password: 'CorrectPassword123!',
        }),
      ).rejects.toThrow(new UnauthorizedException('User account is inactive'));
    });

    it('executes dummy bcrypt compare when user does not exist to mitigate timing enumeration', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const compareMock = bcrypt.compare as jest.Mock;
      compareMock.mockClear();

      await expect(
        service.login({
          email: 'nonexistent@test.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));

      expect(compareMock).toHaveBeenCalledWith(
        'Password123!',
        expect.stringContaining('$2b$10$'),
      );
    });
  });

  describe('3. Refresh Token Rotation & Reuse Detection', () => {
    const rawToken = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    it('rotates valid refresh token and returns new tokens', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-valid',
        tokenHash,
        family: 'fam-1',
        expiresAt: new Date(Date.now() + 100000),
        revokedAt: null,
        userId: 'u-1',
        user: { id: 'u-1', email: 'u1@test.com', role: Role.CUSTOMER, isActive: true },
      });
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt-new' });

      const res = await service.refresh(rawToken);

      expect(res.data.accessToken).toBe('mock-jwt-access-token');
      expect(res.data.refreshToken).toBeDefined();
      expect(res.data.refreshToken).not.toBe(rawToken);
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'rt-valid',
            revokedAt: null,
          }),
        }),
      );
    });

    it('revokes entire family and commits transaction before throwing UnauthorizedException on reuse detection', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-revoked',
        tokenHash,
        family: 'fam-stolen',
        expiresAt: new Date(Date.now() + 100000),
        revokedAt: new Date(Date.now() - 5000),
        userId: 'u-1',
        user: { id: 'u-1', email: 'u1@test.com', role: Role.CUSTOMER, isActive: true },
      });
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 3 });

      const txSpy = jest.spyOn(prisma, '$transaction');

      await expect(service.refresh(rawToken)).rejects.toThrow(
        new UnauthorizedException('Token reuse detected. All sessions in this family have been revoked.'),
      );

      // Verify transaction committed successfully returning { reuseDetected: true } before throw
      expect(txSpy).toHaveBeenCalled();
      await expect(txSpy.mock.results[0].value).resolves.toEqual({ reuseDetected: true });

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            family: 'fam-stolen',
            revokedAt: null,
          },
          data: {
            revokedAt: expect.any(Date),
          },
        }),
      );
    });

    it('rejects expired refresh token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-expired',
        tokenHash,
        family: 'fam-exp',
        expiresAt: new Date(Date.now() - 10000), // Expired
        revokedAt: null,
        userId: 'u-1',
        user: { id: 'u-1', email: 'u1@test.com', role: Role.CUSTOMER, isActive: true },
      });

      await expect(service.refresh(rawToken)).rejects.toThrow(
        new UnauthorizedException('Refresh token has expired'),
      );
    });

    it('race safety: exactly one winning call succeeds when two simultaneous refreshes occur', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-race',
        tokenHash,
        family: 'fam-race',
        expiresAt: new Date(Date.now() + 100000),
        revokedAt: null,
        userId: 'u-race',
        user: { id: 'u-race', email: 'race@test.com', role: Role.CUSTOMER, isActive: true },
      });

      // First call wins the conditional update (count: 1); second call loses (count: 0)
      prisma.refreshToken.updateMany
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 0 });

      prisma.refreshToken.create.mockResolvedValue({ id: 'rt-new' });

      const [res1, res2] = await Promise.allSettled([
        service.refresh(rawToken),
        service.refresh(rawToken),
      ]);

      expect(res1.status).toBe('fulfilled');
      expect(res2.status).toBe('rejected');
      if (res2.status === 'rejected') {
        expect(res2.reason.message).toContain('Refresh token already used');
      }
    });
  });

  describe('4. Forgot & Reset Password', () => {
    it('forgot-password gives identical response whether email exists or not (no user enumeration)', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);
      const resNonExistent = await service.forgotPassword({ email: 'ghost@test.com' });

      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'u-real',
        email: 'real@test.com',
        isActive: true,
      });
      prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
      prisma.passwordResetToken.create.mockResolvedValue({ id: 'prt-1' });

      const resExistent = await service.forgotPassword({ email: 'real@test.com' });

      expect(resNonExistent.message).toBe(resExistent.message);
      expect(resNonExistent.data).toEqual(resExistent.data);
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith('real@test.com', expect.any(String));
    });

    it('forgot-password does not await mail sending (fire-and-forget background execution)', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u-async',
        email: 'async@test.com',
        isActive: true,
      });
      prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
      prisma.passwordResetToken.create.mockResolvedValue({ id: 'prt-async' });

      let mailResolved = false;
      mailService.sendPasswordResetEmail.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              mailResolved = true;
              resolve();
            }, 300);
          }),
      );

      const startTime = Date.now();
      const res = await service.forgotPassword({ email: 'async@test.com' });
      const elapsed = Date.now() - startTime;

      // Method must return immediately (< 150ms) without awaiting the 300ms mail promise
      expect(elapsed).toBeLessThan(150);
      expect(mailResolved).toBe(false);
      expect(res.message).toBeDefined();
    });

    it('forgot-password invalidates earlier unused reset tokens for the user', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u-user',
        email: 'user@test.com',
        isActive: true,
      });
      prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 2 });
      prisma.passwordResetToken.create.mockResolvedValue({ id: 'prt-2' });

      await service.forgotPassword({ email: 'user@test.com' });

      expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'u-user',
            usedAt: null,
          },
          data: {
            usedAt: expect.any(Date),
          },
        }),
      );
    });

    it('reset-password atomically claims single-use token, updates passwordChangedAt, and revokes refresh tokens', async () => {
      const rawResetToken = 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';
      const tokenHash = crypto.createHash('sha256').update(rawResetToken).digest('hex');

      prisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'prt-10',
        tokenHash,
        userId: 'u-reset',
        expiresAt: new Date(Date.now() + 100000),
        usedAt: null,
        user: { id: 'u-reset', email: 'reset@test.com' },
      });
      prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
      prisma.user.update.mockResolvedValue({});
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 4 });

      const res = await service.resetPassword({
        token: rawResetToken,
        newPassword: 'BrandNewSecurePassword123!',
      });

      expect(res.message).toContain('Password has been successfully reset');
      expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'prt-10',
            usedAt: null,
          }),
        }),
      );
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u-reset' },
          data: expect.objectContaining({
            passwordHash: expect.any(String),
            passwordChangedAt: expect.any(Date),
          }),
        }),
      );
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'u-reset',
            revokedAt: null,
          },
        }),
      );
    });

    it('reset-password rejects already used token', async () => {
      const rawResetToken = 'already-used-token';
      const tokenHash = crypto.createHash('sha256').update(rawResetToken).digest('hex');

      prisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'prt-used',
        tokenHash,
        userId: 'u-reset',
        expiresAt: new Date(Date.now() + 100000),
        usedAt: new Date(Date.now() - 1000), // Already used
      });

      await expect(
        service.resetPassword({
          token: rawResetToken,
          newPassword: 'BrandNewSecurePassword123!',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('enforces MaxLength(72) on newPassword in ResetPasswordDto', async () => {
      const valid72 = 'Aa1!' + 'x'.repeat(68);
      const invalid73 = 'Aa1!' + 'x'.repeat(69);

      const validDto = plainToInstance(ResetPasswordDto, {
        token: 'some-token',
        newPassword: valid72,
      });
      const validErrors = await validate(validDto);
      expect(validErrors.filter((e) => e.property === 'newPassword')).toHaveLength(0);

      const invalidDto = plainToInstance(ResetPasswordDto, {
        token: 'some-token',
        newPassword: invalid73,
      });
      const invalidErrors = await validate(invalidDto);
      const pwError = invalidErrors.find((e) => e.property === 'newPassword');
      expect(pwError).toBeDefined();
      expect(pwError?.constraints?.maxLength).toContain('72 characters');
    });
  });

  describe('5. Logout', () => {
    it('revokes only the presented refresh token and returns standardized success', async () => {
      const rawToken = 'logout-refresh-token';
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      const res = await service.logout(rawToken);

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      expect(res).toEqual({
        message: 'Logged out successfully',
        data: {},
      });
    });

    it('always returns identical success response even if no token is provided', async () => {
      const res = await service.logout(undefined);
      expect(res).toEqual({
        message: 'Logged out successfully',
        data: {},
      });
    });
  });

  describe('6. GetMe & Password Exposure Audit', () => {
    it('retrieves user profile without password or passwordHash', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u-profile',
        email: 'profile@test.com',
        name: 'Profile User',
        phone: '1234567890',
        role: Role.CUSTOMER,
        isActive: true,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await service.getMe('u-profile');

      expect(res.data.user.id).toBe('u-profile');
      expect((res.data.user as any).passwordHash).toBeUndefined();
      expect((res.data.user as any).password).toBeUndefined();
    });
  });
});


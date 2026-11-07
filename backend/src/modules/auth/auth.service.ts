import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Inject,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { IMailService, MAIL_SERVICE } from './mail.service';
import { Role } from '../../common/constants';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly accessExpiresIn: string;
  private readonly refreshTtlMs: number;
  // Constant-time defense: precomputed bcrypt hash for dummy compare when user does not exist
  private readonly dummyPasswordHash =
    '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012';

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(MAIL_SERVICE) private readonly mailService: IMailService,
  ) {
    this.accessExpiresIn =
      this.configService.get<string>('auth.jwtAccessExpiresIn') || '15m';

    // Parse refresh TTL from env (default 30 days)
    const refreshExpiresInStr =
      this.configService.get<string>('auth.jwtRefreshExpiresIn') || '30d';
    this.refreshTtlMs = this.parseDurationToMs(refreshExpiresInStr, 30 * 24 * 60 * 60 * 1000);
  }

  private parseDurationToMs(duration: string, defaultMs: number): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return defaultMs;
    const val = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's':
        return val * 1000;
      case 'm':
        return val * 60 * 1000;
      case 'h':
        return val * 60 * 60 * 1000;
      case 'd':
        return val * 24 * 60 * 60 * 1000;
      default:
        return defaultMs;
    }
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name || null,
        phone: dto.phone || null,
        role: Role.CUSTOMER, // Strictly forced to CUSTOMER
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Auto-login upon registration: issue tokens
    const tokens = await this.createSession(user.id, user.email, user.role);

    return {
      message: 'Registration successful',
      data: {
        user,
        ...tokens,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      // Execute dummy bcrypt compare to defend against timing enumeration
      await bcrypt.compare(dto.password, this.dummyPasswordHash);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    const rawPassword = dto.password || '';
    const trimmedPassword = rawPassword.trim();
    let isMatch = await bcrypt.compare(rawPassword, user.passwordHash);
    if (!isMatch && trimmedPassword !== rawPassword) {
      isMatch = await bcrypt.compare(trimmedPassword, user.passwordHash);
    }

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update lastLoginAt
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.createSession(user.id, user.email, user.role);

    return {
      message: 'Login successful',
      access_token: tokens.accessToken,
      accessToken: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
        ...tokens,
      },
    };
  }

  private async createSession(userId: string, email: string, role: string) {
    const family = crypto.randomUUID();
    const rawRefreshToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + this.refreshTtlMs);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        family,
        expiresAt,
      },
    });

    const accessToken = this.jwtService.sign(
      {
        sub: userId,
        email,
        role,
      },
      {
        expiresIn: this.accessExpiresIn as any,
      },
    );

    return {
      accessToken,
      access_token: accessToken,
      refreshToken: rawRefreshToken,
      refresh_token: rawRefreshToken,
    };
  }

  async refresh(rawRefreshToken: string) {
    if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
      throw new UnauthorizedException('Refresh token is required');
    }

    const tokenHash = this.hashToken(rawRefreshToken);

    // Atomic transaction: commits family revocation on reuse detection before throwing outside
    const result = await this.prisma.$transaction(async (tx) => {
      const existingRecord = await tx.refreshToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (!existingRecord) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Reuse detection: revoke all tokens in family and COMMIT transaction
      if (existingRecord.revokedAt !== null) {
        await tx.refreshToken.updateMany({
          where: {
            family: existingRecord.family,
            revokedAt: null,
          },
          data: {
            revokedAt: new Date(),
          },
        });
        return { reuseDetected: true as const };
      }

      // Check expiration
      if (existingRecord.expiresAt <= new Date()) {
        throw new UnauthorizedException('Refresh token has expired');
      }

      // Race-safe rotation: conditional UPDATE with row-count check
      const now = new Date();
      const updateResult = await tx.refreshToken.updateMany({
        where: {
          id: existingRecord.id,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: {
          revokedAt: now,
        },
      });

      if (updateResult.count === 0) {
        // Another concurrent refresh won the race
        throw new UnauthorizedException('Refresh token already used');
      }

      // Inactive user check
      if (!existingRecord.user || !existingRecord.user.isActive) {
        throw new UnauthorizedException('User account is inactive');
      }

      // Issue rotated refresh token in the same family
      const newRawRefreshToken = crypto.randomBytes(32).toString('hex');
      const newTokenHash = this.hashToken(newRawRefreshToken);
      const newExpiresAt = new Date(Date.now() + this.refreshTtlMs);

      await tx.refreshToken.create({
        data: {
          userId: existingRecord.userId,
          tokenHash: newTokenHash,
          family: existingRecord.family,
          expiresAt: newExpiresAt,
        },
      });

      const accessToken = this.jwtService.sign(
        {
          sub: existingRecord.user.id,
          email: existingRecord.user.email,
          role: existingRecord.user.role,
        },
        {
          expiresIn: this.accessExpiresIn as any,
        },
      );

      return {
        reuseDetected: false as const,
        tokens: {
          accessToken,
          access_token: accessToken,
          refreshToken: newRawRefreshToken,
          refresh_token: newRawRefreshToken,
        },
      };
    }, { maxWait: 10000, timeout: 15000 });

    if (result.reuseDetected) {
      throw new UnauthorizedException(
        'Token reuse detected. All sessions in this family have been revoked.',
      );
    }

    return {
      message: 'Tokens refreshed successfully',
      data: result.tokens,
    };
  }

  async logout(rawRefreshToken?: string) {
    if (rawRefreshToken && typeof rawRefreshToken === 'string') {
      const tokenHash = this.hashToken(rawRefreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    // Always returns identical success response
    return {
      message: 'Logged out successfully',
      data: {},
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account not found or inactive');
    }

    return {
      message: 'User profile retrieved',
      data: { user },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Timing-consistent path: only generate token if active user exists
    if (user && user.isActive) {
      // Invalidate earlier unused reset tokens
      await this.prisma.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
        data: {
          usedAt: new Date(),
        },
      });

      // Generate 32-byte high-entropy reset token
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = this.hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour TTL

      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      // Do NOT await mail dispatch: fire-and-forget to avoid blocking the HTTP response
      this.mailService
        .sendPasswordResetEmail(user.email, rawToken)
        .catch((err) => {
          this.logger.error(
            `Failed to dispatch background password reset email: ${err?.message}`,
          );
        });
    }

    // Always identical response: prevents user enumeration
    return {
      message: 'If that email is registered, a password reset link has been sent.',
      data: {},
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.hashToken(dto.token);

    const resetRecord = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.usedAt !== null || resetRecord.expiresAt <= new Date()) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    // Atomically claim the single-use token
    const now = new Date();
    const updateCount = await this.prisma.passwordResetToken.updateMany({
      where: {
        id: resetRecord.id,
        usedAt: null,
        expiresAt: { gt: now },
      },
      data: {
        usedAt: now,
      },
    });

    if (updateCount.count === 0) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    // Update user password and set passwordChangedAt
    await this.prisma.user.update({
      where: { id: resetRecord.userId },
      data: {
        passwordHash,
        passwordChangedAt: now,
      },
    });

    // Revoke all active refresh tokens for this user
    await this.prisma.refreshToken.updateMany({
      where: {
        userId: resetRecord.userId,
        revokedAt: null,
      },
      data: {
        revokedAt: now,
      },
    });

    return {
      message: 'Password has been successfully reset. Please log in with your new password.',
      data: {},
    };
  }

  async changePassword(userId: string, currentPass: string, newPass: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(currentPass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (!newPass || newPass.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters long');
    }

    const now = new Date();
    const passwordHash = await bcrypt.hash(newPass, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordChangedAt: now,
      },
    });

    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now },
    });

    return { message: 'Password changed successfully' };
  }
}

import { ExecutionContext, UnauthorizedException, ForbiddenException, HttpStatus, HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { JwtStrategy } from '../../modules/auth/jwt.strategy';
import { TransformResponseInterceptor } from '../interceptors/transform-response.interceptor';
import { AllExceptionsFilter } from '../filters/all-exceptions.filter';
import { Role } from '../constants';
import { of } from 'rxjs';

describe('Auth Guards & Contract Filters (Unit Tests)', () => {
  let reflector: Reflector;
  let jwtGuard: JwtAuthGuard;
  let rolesGuard: RolesGuard;
  let jwtStrategy: JwtStrategy;
  let prismaMock: any;

  beforeEach(() => {
    reflector = new Reflector();
    jwtGuard = new JwtAuthGuard(reflector);
    rolesGuard = new RolesGuard(reflector);

    prismaMock = {
      user: {
        findUnique: jest.fn(),
      },
    };

    const configServiceMock = {
      getOrThrow: jest.fn().mockReturnValue('test-jwt-secret-key-32-chars-long!'),
      get: jest.fn().mockReturnValue('15m'),
    };

    jwtStrategy = new JwtStrategy(configServiceMock as any, prismaMock);
  });

  function createMockExecutionContext(user?: any, isPublic = false, requiredRoles?: string[]): ExecutionContext {
    const request = {
      user,
      headers: user ? { authorization: 'Bearer mock-token' } : {},
      method: 'GET',
      url: '/api/admin/ping',
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis(),
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  describe('1. JwtAuthGuard & JwtStrategy Validation', () => {
    it('bypasses guard when @Public() decorator is present', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      const context = createMockExecutionContext(undefined, true);
      expect(jwtGuard.canActivate(context)).toBe(true);
    });

    it('rejects user whose passwordChangedAt is later than token iat (at second granularity)', async () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const tokenIat = nowSec - 60; // Token issued 60 seconds ago
      const passwordChangedAt = new Date((nowSec - 10) * 1000); // Password changed 10 seconds ago

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u-1',
        email: 'user@test.com',
        role: Role.CUSTOMER,
        isActive: true,
        passwordChangedAt,
      });

      await expect(
        jwtStrategy.validate({
          sub: 'u-1',
          email: 'user@test.com',
          role: Role.CUSTOMER,
          iat: tokenIat,
          exp: nowSec + 3600,
        }),
      ).rejects.toThrow(
        new UnauthorizedException('Password has been changed. Please log in again.'),
      );
    });

    it('allows user when token iat is equal to or after passwordChangedAt', async () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const tokenIat = nowSec;
      const passwordChangedAt = new Date((nowSec - 10) * 1000);

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u-1',
        email: 'user@test.com',
        role: Role.CUSTOMER,
        isActive: true,
        passwordChangedAt,
      });

      const user = await jwtStrategy.validate({
        sub: 'u-1',
        email: 'user@test.com',
        role: Role.CUSTOMER,
        iat: tokenIat,
        exp: nowSec + 3600,
      });

      expect(user.id).toBe('u-1');
      expect(user.isActive).toBe(true);
    });

    it('rejects inactive user during token validation on every request', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u-inactive',
        email: 'inactive@test.com',
        role: Role.CUSTOMER,
        isActive: false,
      });

      await expect(
        jwtStrategy.validate({
          sub: 'u-inactive',
          email: 'inactive@test.com',
          role: Role.CUSTOMER,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        }),
      ).rejects.toThrow(new UnauthorizedException('User account is inactive'));
    });
  });

  describe('2. RolesGuard RBAC', () => {
    it('blocks CUSTOMER from /api/admin/ping with ForbiddenException', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === 'roles') return [Role.ADMIN];
        return false;
      });

      const context = createMockExecutionContext({
        id: 'u-customer',
        role: Role.CUSTOMER,
      });

      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('allows ADMIN on /api/admin/ping', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === 'roles') return [Role.ADMIN];
        return false;
      });

      const context = createMockExecutionContext({
        id: 'u-admin',
        role: Role.ADMIN,
      });

      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it('blocks unauthenticated request when role is required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === 'roles') return [Role.ADMIN];
        return false;
      });

      const context = createMockExecutionContext(undefined);
      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe('3. Response Contract & Error Shape Verification', () => {
    it('TransformResponseInterceptor formats success responses to { success: true, message: "", data: {} }', (done) => {
      const interceptor = new TransformResponseInterceptor();
      const mockCallHandler = {
        handle: () => of({ ping: 'pong' }),
      };

      interceptor.intercept({} as any, mockCallHandler as any).subscribe((res) => {
        expect(res).toEqual({
          success: true,
          message: '',
          data: { ping: 'pong' },
        });
        done();
      });
    });

    it('AllExceptionsFilter formats error responses to { success: false, message: "", error: { code: "" } }', () => {
      const filter = new AllExceptionsFilter();
      const mockJson = jest.fn();
      const mockStatus = jest.fn().mockReturnValue({ json: mockJson });

      const host = {
        switchToHttp: () => ({
          getResponse: () => ({
            status: mockStatus,
          }),
          getRequest: () => ({
            method: 'POST',
            url: '/api/auth/login',
          }),
        }),
      } as unknown as ExecutionContext;

      const exception = new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      filter.catch(exception, host as any);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid credentials',
        error: {
          code: 'UNAUTHORIZED',
        },
      });
    });
  });
});


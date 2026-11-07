import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';

describe('AuthController (Unit Tests)', () => {
  let controller: AuthController;
  let authService: any;

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
      getMe: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('cookie-only refresh: successfully reads token from req.cookies when body is empty', async () => {
    const rawCookieToken = 'valid-cookie-refresh-token';
    const mockReq = {
      cookies: {
        refreshToken: rawCookieToken,
      },
    } as unknown as Request;

    const mockRes = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    } as unknown as Response;

    authService.refresh.mockResolvedValue({
      message: 'Tokens refreshed successfully',
      data: {
        accessToken: 'new-access-token',
        refreshToken: 'new-cookie-refresh-token',
      },
    });

    // Empty body DTO {}
    const res = await controller.refresh({}, mockReq, mockRes);

    expect(authService.refresh).toHaveBeenCalledWith(rawCookieToken);
    expect(mockRes.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'new-cookie-refresh-token',
      expect.objectContaining({
        httpOnly: true,
        path: '/api/auth',
      }),
    );
    expect(res.data.accessToken).toBe('new-access-token');
  });

  it('logout: clears refreshToken cookie and calls service with presented token', async () => {
    const mockReq = {
      cookies: {
        refreshToken: 'presented-token-to-logout',
      },
    } as unknown as Request;

    const mockRes = {
      clearCookie: jest.fn(),
    } as unknown as Response;

    authService.logout.mockResolvedValue({
      message: 'Logged out successfully',
      data: {},
    });

    const res = await controller.logout({}, mockReq, mockRes);

    expect(mockRes.clearCookie).toHaveBeenCalledWith(
      'refreshToken',
      expect.objectContaining({
        httpOnly: true,
        path: '/api/auth',
      }),
    );
    expect(authService.logout).toHaveBeenCalledWith('presented-token-to-logout');
    expect(res.message).toBe('Logged out successfully');
  });
});


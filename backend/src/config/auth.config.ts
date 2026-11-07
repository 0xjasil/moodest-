import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => {
  const jwtSecret = process.env.JWT_SECRET?.trim();

  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error(
      'Security boot failure: JWT_SECRET must be defined and at least 32 characters long.',
    );
  }

  // Refresh tokens are opaque 32-byte cryptographically secure random tokens
  // stored as SHA-256 hashes in the database with family rotation (not signed JWTs).
  // Hence JWT_REFRESH_SECRET is removed from active configuration to prevent dead secret sprawl.
  return {
    jwtSecret,
    jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN?.trim() || '15m',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN?.trim() || '30d',
  };
});

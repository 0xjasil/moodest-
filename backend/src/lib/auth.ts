import { betterAuth } from 'better-auth';
import { prisma } from '@/lib/prisma';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { admin } from 'better-auth/plugins/admin';
import { sendPasswordResetEmail } from '@/lib/email-utils';

const getPublicAppUrl = () => {
  const configuredUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000';
  return configuredUrl.replace(/\/$/, '');
};

export const normalizeResetPasswordUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    const publicAppUrl = new URL(getPublicAppUrl());

    parsedUrl.protocol = publicAppUrl.protocol;
    parsedUrl.host = publicAppUrl.host;
    parsedUrl.username = publicAppUrl.username;
    parsedUrl.password = publicAppUrl.password;
    parsedUrl.port = publicAppUrl.port;

    return parsedUrl.toString();
  } catch {
    return `${getPublicAppUrl()}${url.startsWith('/') ? url : `/${url}`}`;
  }
};

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      const resetUrl = normalizeResetPasswordUrl(url);
      await sendPasswordResetEmail(user.email, resetUrl);
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'user',
        input: true,
      },
      branch: {
        type: 'string',
        required: false,
        input: true,
      },
    },
  },
  plugins: [
    admin({
      adminRoles: ['admin'],
    }),
    nextCookies(), // This MUST be the last plugin
  ],
});

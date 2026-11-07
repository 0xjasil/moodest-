import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';

import { AppModule } from './app.module';
import { createValidationPipe } from './common/pipes/validation.pipe';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  // Trust proxy for reverse proxies (Render, Vercel, AWS ALB, Cloudflare)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  // Security headers with Helmet
  app.use(helmet());

  // Cookie Parser
  app.use(cookieParser());

  // Global JSON body parser with 1mb limit and raw body verification for webhooks
  app.use(
    json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
      limit: '1mb',
    }),
  );
  app.use(urlencoded({ extended: true, limit: '1mb' }));

  // Global API Prefix
  const apiPrefix = (process.env.API_PREFIX || '/api').replace(/^\//, '');
  app.setGlobalPrefix(apiPrefix);

  // Parse and normalize allowed origins from environment variables
  const rawOrigins = [
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL,
    process.env.ALLOWED_ORIGINS,
    'https://modest-eta.vercel.app',
    'https://admin-moodest-25.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:5173',
  ]
    .filter(Boolean)
    .flatMap((entry) => (entry as string).split(','))
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  const allowedOriginsSet = new Set(rawOrigins);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, server-to-server, curl)
      if (!origin) {
        return callback(null, true);
      }

      const cleanOrigin = origin.trim().replace(/\/+$/, '');

      // Check explicit allowed origins
      if (allowedOriginsSet.has(cleanOrigin)) {
        return callback(null, true);
      }

      // Automatically allow all Vercel deployments and localhost
      const isVercelDomain = /^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/i.test(cleanOrigin);
      const isLocalhost = /^http:\/\/localhost:\d+$/i.test(cleanOrigin);

      if (isVercelDomain || isLocalhost) {
        return callback(null, true);
      }

      logger.warn(`CORS blocked for origin: ${origin}`);
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
    exposedHeaders: ['Set-Cookie'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Global Validation Pipe (whitelist, forbidNonWhitelisted, transform)
  app.useGlobalPipes(createValidationPipe());

  // Swagger Documentation (Development only)
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Moodest E-Commerce API')
      .setDescription('Production NestJS backend API for Moodest Single-Brand Abaya Store')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
    logger.log('Swagger documentation configured at /api/docs');
  }

  // Graceful shutdown hooks
  app.enableShutdownHooks();

  const port = parseInt(process.env.PORT || '4000', 10);
  await app.listen(port);
  logger.log(`Moodest NestJS backend running on http://localhost:${port}/${apiPrefix}`);
}

bootstrap();

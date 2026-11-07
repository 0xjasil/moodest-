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

  // CORS whitelist: localhost only allowed in non-production environments
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL,
  ].filter(Boolean) as string[];

  if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.push('http://localhost:3000', 'http://localhost:3001');
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // Return false without throwing error to cleanly reject disallowed origins
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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

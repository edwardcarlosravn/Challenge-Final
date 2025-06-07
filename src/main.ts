import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
// import { GlobalExceptionFilter } from './infrastructure/common/filters/global-exception.filter';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.useGlobalFilters(app.get(GlobalExceptionFilter));
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          imgSrc: [
            `'self'`,
            'data:',
            'apollo-server-landing-page.cdn.apollographql.com',
          ],
          scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
          manifestSrc: [
            `'self'`,
            'apollo-server-landing-page.cdn.apollographql.com',
          ],
          frameSrc: [`'self'`, 'sandbox.embed.apollographql.com'],
        },
      },
    }),
  );
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(','),
    methods: 'GET,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization',
  });
  app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
  app.use(express.json());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  await app.listen(app.get(ConfigService).getOrThrow('PORT'));
}
bootstrap();

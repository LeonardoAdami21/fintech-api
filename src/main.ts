// src/main.ts
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };

  const cfg = app.get(ConfigService);
  const port = cfg.get<number>('APP_PORT', 3000);
  const env = cfg.get<string>('NODE_ENV', 'development');

  // ── CORS ───────────────────────────────────────────────────────────────────
  const origins = cfg.get<string>('ALLOWED_ORIGINS', '*');
  app.enableCors({
    origin: origins === '*' ? true : origins.split(','),
    credentials: true,
  });

  // ── Global prefix ──────────────────────────────────────────────────────────
  app.setGlobalPrefix('v1');

  // ── Swagger (dev only) ─────────────────────────────────────────────────────
  if (env !== 'production') {
    const doc = new DocumentBuilder()
      .setTitle('Fintech API')
      .setDescription(
        '## Api de pagamentos, evitando falsificação de transações PIX\n\n' +
          'Autentique-se via `POST /api/v1/auth/login` e use o `accessToken` retornado no botão **Authorize**.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Auth', 'Registro, login, refresh token e sessões')
      .addTag('Accounts', 'Conta corrente e chaves PIX')
      .addTag('Payments', 'Pagamentos PIX e TED')
      .build();

    const document = SwaggerModule.createDocument(app, doc);
    SwaggerModule.setup('v1/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(port, () => {
    logger.log(`🚀 Server started on http://localhost:${port}`);
    logger.log(`Swagger → http://localhost:${port}/v1/docs`);
  });
}

bootstrap();

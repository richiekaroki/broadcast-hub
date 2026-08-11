import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const isProduction = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create(AppModule);

  app.use(helmet({
    contentSecurityPolicy: isProduction ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    } : false,
    hsts: { maxAge: 31536000, includeSubDomains: true },
  }));

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Wam Broadcast Hub API')
      .setDescription('Media & broadcasting management platform')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
    logger.log(`Swagger docs: http://localhost:${process.env.PORT || 4000}/api/docs`);
  }

  app.getHttpAdapter().get('/', (_req, res) => {
    res.json({
      name: 'Wam Broadcast Hub API',
      version: '1.0',
      docs: '/api/docs',
      health: '/health',
      endpoints: {
        auth: '/api/v1/auth',
        content: '/api/v1/content',
        programs: '/api/v1/programs',
        dashboard: '/api/v1/dashboard',
      },
    });
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);

  logger.log(`API running on http://localhost:${port}`);
}

bootstrap();

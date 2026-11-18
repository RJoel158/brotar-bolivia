import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { configureHttp } from './shared/http/configure-http';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });

  configureHttp(app);
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Brotar API')
    .setDescription('API REST para la plataforma de Crowdfunding Verde Brotar (Users, Auth, Campaigns & Admin)')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa tu Bearer token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🌿 Brotar Backend running on: http://localhost:${port}`);
  console.log(`📄 Swagger Docs available at: http://localhost:${port}/api/docs`);
}
bootstrap();

import type { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'body-parser';

/** Shared by the real bootstrap and the isolated QA server. */
export function configureHttp(app: NestExpressApplication): void {
  const normalJson = json({ limit: '1mb' });
  const authJson = json({ limit: '16kb' });
  const evidenceJson = json({ limit: '16mb' });
  const avatarJson = json({ limit: '8mb' });
  app.use((req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => {
    const path = req.path.replace(/\/+$/, '');
    const parser = path.startsWith('/auth/') ? authJson
      : (path === '/users/me/kyc' && req.method === 'POST') || (path === '/users' && req.method === 'POST') ? evidenceJson
      : path === '/users/me' && req.method === 'PATCH' ? avatarJson : normalJson;
    parser(req, res, next);
  });
  app.use(urlencoded({ extended: true, limit: '64kb', parameterLimit: 100 }));
  const configured = process.env.FRONTEND_URL;
  const origins = configured ? [new URL(configured).origin] : [];
  if (process.env.NODE_ENV !== 'production') origins.push('http://localhost:5173', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174');
  if (process.env.NODE_ENV === 'production' && origins.length === 0) throw new Error('FRONTEND_URL must be configured in production.');
  app.enableCors({ origin: [...new Set(origins)] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: true } }));
}

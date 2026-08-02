import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/modules/app/module';

jest.mock('ccxt', () => {
  class ExchangeError extends Error {}
  class AuthenticationError extends ExchangeError {}
  class NetworkError extends Error {}

  return {
    AuthenticationError,
    ExchangeError,
    NetworkError,
    gate: jest.fn(),
  };
});

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    app = await NestFactory.create(AppModule, { logger: false });
    await app.init();
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('/api/cex/gate/balance reports missing configuration (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/cex/gate/balance')
      .expect(503);
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Content-Type', /html/);
  });

  it('/docs (GET)', () => {
    return request(app.getHttpServer())
      .get('/docs')
      .expect(200)
      .expect('Content-Type', /html/);
  });

  afterEach(async () => {
    await app.close();
  });
});

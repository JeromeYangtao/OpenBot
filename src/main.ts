import { NestFactory } from '@nestjs/core';
import config from '../config/env.json';
import { AppModule } from './app.module';

function getPort(): number {
  const port = Number(process.env.PORT ?? config.port);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT 必须是 1 到 65535 之间的整数');
  }

  return port;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = getPort();
  await app.listen(port);
}

void bootstrap();

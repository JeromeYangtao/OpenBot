import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { AppController } from '../../controller/app/controller';
import { CexModule } from '../cex/module';
import { DatabaseModule } from '../database/module';
import { AppService } from './app.service';

@Module({
  imports: [
    DatabaseModule,
    CexModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      renderPath: '/{*path}',
      exclude: ['/api', '/api/{*path}'],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

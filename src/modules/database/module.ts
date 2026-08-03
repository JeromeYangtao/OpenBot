import { Global, Module } from '@nestjs/common';
import config from '../../../config/env.json';
import { DatabaseService } from './service';

@Global()
@Module({
  providers: [
    {
      provide: DatabaseService,
      useFactory: () =>
        new DatabaseService(config.database?.path ?? 'data/openbot.db'),
    },
  ],
  exports: [DatabaseService],
})
export class DatabaseModule {}

import { Module } from '@nestjs/common';
import { gate } from 'ccxt';
import config from '../../../config/env.json';
import { GateController } from '../../controller/cex/gate.controller';
import { GATE_CREDENTIALS, GATE_EXCHANGE_FACTORY } from './gate.constants';
import { GateService } from './gate.service';
import type { GateExchange } from './gate.types';

@Module({
  controllers: [GateController],
  providers: [
    GateService,
    {
      provide: GATE_CREDENTIALS,
      useValue: config.gate,
    },
    {
      provide: GATE_EXCHANGE_FACTORY,
      inject: [GATE_CREDENTIALS],
      useFactory: (credentials: typeof config.gate) => (): GateExchange =>
        new gate({ ...credentials, enableRateLimit: true }),
    },
  ],
})
export class CexModule {}

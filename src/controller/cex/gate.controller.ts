import { Controller, Get } from '@nestjs/common';
import { GateBalanceResponseDto } from '../../modules/cex/dto/gate-balance.dto';
import { GateService } from '../../modules/cex/gate.service';

@Controller('api/cex/gate')
export class GateController {
  constructor(private readonly gateService: GateService) {}

  @Get('balance')
  fetchBalance(): Promise<GateBalanceResponseDto> {
    return this.gateService.fetchBalance();
  }
}

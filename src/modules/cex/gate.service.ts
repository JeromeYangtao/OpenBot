import {
  BadGatewayException,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AuthenticationError,
  ExchangeError,
  NetworkError,
  type Balance,
  type Balances,
} from 'ccxt';
import {
  GateAssetBalanceDto,
  GateBalanceResponseDto,
} from './dto/gate-balance.dto';
import { GATE_CREDENTIALS, GATE_EXCHANGE_FACTORY } from './gate.constants';
import type { GateCredentials, GateExchangeFactory } from './gate.types';

@Injectable()
export class GateService {
  constructor(
    @Inject(GATE_EXCHANGE_FACTORY)
    private readonly createExchange: GateExchangeFactory,
    @Inject(GATE_CREDENTIALS)
    private readonly credentials: GateCredentials,
  ) {}

  async fetchBalance(): Promise<GateBalanceResponseDto> {
    this.validateCredentials();

    const exchange = this.createExchange();

    try {
      const balances = await exchange.fetchBalance();
      return { balances: this.normalizeBalances(balances) };
    } catch (error: unknown) {
      this.handleExchangeError(error);
    } finally {
      await exchange.close().catch(() => undefined);
    }
  }

  private validateCredentials(): void {
    if (
      typeof this.credentials?.apiKey !== 'string' ||
      this.credentials.apiKey.trim() === '' ||
      typeof this.credentials.secret !== 'string' ||
      this.credentials.secret.trim() === ''
    ) {
      throw new ServiceUnavailableException('Gate API 凭证尚未配置');
    }
  }

  private normalizeBalances(balances: Balances): GateAssetBalanceDto[] {
    return Object.entries(balances)
      .filter(
        (entry): entry is [string, Balance] =>
          typeof entry[1] === 'object' &&
          entry[1] !== null &&
          ('free' in entry[1] || 'used' in entry[1] || 'total' in entry[1]),
      )
      .map(([currency, balance]) => ({
        currency,
        free: this.toNumber(balance.free),
        used: this.toNumber(balance.used),
        total: this.toNumber(balance.total),
      }))
      .filter(
        ({ free, used, total }) => free !== 0 || used !== 0 || total !== 0,
      )
      .sort((left, right) => left.currency.localeCompare(right.currency));
  }

  private toNumber(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }

  private handleExchangeError(error: unknown): never {
    if (error instanceof AuthenticationError) {
      throw new UnauthorizedException('Gate API 凭证无效或权限不足');
    }

    if (error instanceof NetworkError) {
      throw new ServiceUnavailableException('暂时无法连接 Gate');
    }

    if (error instanceof ExchangeError) {
      throw new BadGatewayException('Gate 返回异常响应');
    }

    throw error;
  }
}

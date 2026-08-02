import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticationError, type Balances } from 'ccxt';
import { GateService } from '../../../src/modules/cex/gate.service';
import type {
  GateExchange,
  GateExchangeFactory,
} from '../../../src/modules/cex/gate.types';

jest.mock('ccxt', () => {
  class ExchangeError extends Error {}
  class AuthenticationError extends ExchangeError {}
  class NetworkError extends Error {}

  return { AuthenticationError, ExchangeError, NetworkError };
});

describe('GateService', () => {
  const asBalances = (value: unknown): Balances => value as Balances;

  const createService = (
    balancesOrError: Balances | Error,
    credentials = { apiKey: 'api-key', secret: 'secret' },
  ) => {
    const closeMock = jest.fn().mockResolvedValue(undefined);
    const exchange: GateExchange = {
      fetchBalance: jest.fn().mockImplementation(() => {
        if (balancesOrError instanceof Error) {
          return Promise.reject(balancesOrError);
        }

        return Promise.resolve(balancesOrError);
      }),
      close: closeMock,
    };
    const factory: jest.MockedFunction<GateExchangeFactory> = jest
      .fn()
      .mockReturnValue(exchange);

    return {
      service: new GateService(factory, credentials),
      closeMock,
      factory,
    };
  };

  it('returns non-zero balances without raw exchange data', async () => {
    const { service, closeMock, factory } = createService(
      asBalances({
        info: { sensitive: 'raw-response' },
        timestamp: 1,
        datetime: '2026-08-02T00:00:00.000Z',
        USDT: { free: 10, used: 2, total: 12 },
        BTC: { free: 0, used: 0, total: 0 },
      }),
    );

    await expect(service.fetchBalance()).resolves.toEqual({
      balances: [{ currency: 'USDT', free: 10, used: 2, total: 12 }],
    });
    expect(factory).toHaveBeenCalledWith();
    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  it('rejects empty credentials before creating an exchange', async () => {
    const { service, factory } = createService(asBalances({ info: {} }), {
      apiKey: '',
      secret: '',
    });

    await expect(service.fetchBalance()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(factory).not.toHaveBeenCalled();
  });

  it('maps Gate authentication failures and closes the exchange', async () => {
    const { service, closeMock } = createService(
      new AuthenticationError('invalid credentials'),
    );

    await expect(service.fetchBalance()).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(closeMock).toHaveBeenCalledTimes(1);
  });
});

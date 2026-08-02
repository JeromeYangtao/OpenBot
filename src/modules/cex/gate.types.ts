import type { Balances } from 'ccxt';

export interface GateCredentials {
  apiKey: string;
  secret: string;
}

export interface GateExchange {
  fetchBalance(): Promise<Balances>;
  close(): Promise<void>;
}

export type GateExchangeFactory = () => GateExchange;

export interface GateAssetBalanceDto {
  currency: string;
  free: number;
  used: number;
  total: number;
}

export interface GateBalanceResponseDto {
  balances: GateAssetBalanceDto[];
}

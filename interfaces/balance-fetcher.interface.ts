export interface BalanceFetcher {
  fetchUserBalances(apiKey: string): Promise<Balance[]>;
}

export interface Balance {
  name: string;
  quantity: bigint | number;
}

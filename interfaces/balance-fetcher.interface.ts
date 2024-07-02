import { IntegrationMetadata } from "./general.interface.ts";

export interface BalanceFetcher {
  fetchUserBalances(apiKey: IntegrationMetadata): Promise<Balance[]>;
}

export interface Balance {
  name: string;
  quantity: bigint | number;
}

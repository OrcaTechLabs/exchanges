import { IntegrationMetadata, KnownAsset } from "./general.interface.ts";

export interface TransactionFetcher {
  fetchUserTransactions(
    IntegrationMetadata: IntegrationMetadata,
    config: {
      latestAssetTransactionRecords: Transaction[];
      supportedAssets: KnownAsset[];
    }
  ): Promise<Transaction[]>;
}

export type TransactionType = "buy" | "sell" | "deposit" | "withdrawal";
export interface Transaction {
  time: Date;
  type: TransactionType;
  asset_name: string;
  quantity: bigint | number;
  price: number | null;
  balance: bigint | number;
  meta: Record<string, unknown>;
}

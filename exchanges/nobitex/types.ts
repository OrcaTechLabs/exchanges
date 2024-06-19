export interface NobitexResponseBase {
  status: string;
}

export interface Stats extends NobitexResponseBase {
  stats: Record<string, AssetStats>;
}

export interface AssetStats {
  isClosed: boolean;
  bestSell: string;
  bestBuy: string;
  volumeSrc: string;
  volumeDst: string;
  latest: string;
  mark: string;
  dayLow: string;
  dayHigh: string;
  dayOpen: string;
  dayClose: string;
  dayChange: string;
}

export interface UserWallets extends NobitexResponseBase {
  wallets: Wallet[];
}

export interface Wallet {
  depositAddress: string | null;
  depositTag: string | null;
  depositInfo: Record<string, DepositInfo>;
  id: number;
  currency: string;
  balance: string;
  blockedBalance: string;
  activeBalance: string;
  rialBalance: number;
  rialBalanceSell: number;
}

export interface DepositInfo {
  address: string | null;
  tag: string | null;
}

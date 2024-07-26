interface AssetConfigType {
  isInverted?: boolean;
  symbol?: string;
  baseAsset: string;
  isRoot: boolean;
  multiplier: number;
  accuracy: number;
}

const configMap = new Map<string, AssetConfigType>();

configMap.set("rls", {
  baseAsset: "irr",
  accuracy: 0.00000001,
  isRoot: false,
  multiplier: 1,
  isInverted: false,
});

configMap.set("usdt", {
  baseAsset: "usd",
  accuracy: 0.01,
  isRoot: true,
  multiplier: 1,
  isInverted: false,
});

configMap.set("﷼", {
  isInverted: true,
  symbol: "USDTIRT",
  baseAsset: "irr",
  multiplier: 10,
  isRoot: false,
  accuracy: 0.00000001,
});

configMap.set("تتر", {
  isInverted: false,
  baseAsset: "usd",
  isRoot: true,
  multiplier: 1,
  accuracy: 0.01,
});

configMap.set("بیت‌کوین", {
  isInverted: false,
  symbol: "BTCUSD",
  baseAsset: "btc",
  isRoot: false,
  accuracy: 0.00000001,
  multiplier: 1,
});

export { configMap };

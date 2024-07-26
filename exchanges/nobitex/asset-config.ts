interface AssetConfigType {
  isInverted?: boolean;
  symbol?: string;
  baseAsset: string;
  isRoot?: boolean;
  multiplier?: number;
}

const configMap = new Map<string, AssetConfigType>();

configMap.set("rls", {
  baseAsset: "irr",
});

configMap.set("usdt", {
  baseAsset: "usd",
});

configMap.set("ریال", {
  isInverted: true,
  symbol: "USDTIRT",
  baseAsset: "irr",
  multiplier: 1,
  isRoot: false,
});

configMap.set("تتر", {
  isInverted: false,
  symbol: "BTCUSDT",
  baseAsset: "usd",
  isRoot: true,
});

configMap.set("بیت‌کوین", {
  isInverted: false,
  symbol: "BTCUSD",
  baseAsset: "usd",
  isRoot: false,
});

export { configMap };

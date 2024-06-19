export interface ValueFetcher {
  fetchAssetValues(requestedAssets: string[]): Promise<AssetValue[]>;
}

export interface AssetValue {
  name: string;
  value: number | null;
}

export interface UdfFetcher {
  fetchUdf(config: UdfFetcherConfig): Promise<FormattedUdf[]>;
}

export interface UdfFetcherConfig {
  symbol: string;
  resolution: `${number}` | `${number}D`;
  from: number;
  to: number;
}

export interface FormattedUdf {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

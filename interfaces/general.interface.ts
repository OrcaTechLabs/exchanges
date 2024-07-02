export interface KnownAsset {
  name: string;
  type: "token" | "fiat";
  aliases: string[];
}

export interface IntegrationMetadata {
  [key: string]: unknown;
}

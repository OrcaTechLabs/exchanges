export interface KnownAsset {
  name: string;
  type: "token" | "fiat";
  aliases: string[];
}

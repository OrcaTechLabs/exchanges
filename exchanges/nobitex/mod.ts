import {
  Balance,
  BalanceFetcher,
} from "../../interfaces/balance-fetcher.interface.ts";
import {
  AssetValue,
  ValueFetcher,
} from "../../interfaces/value-fetcher.interface.ts";
import { ofetch } from "../../libs/ofetch.ts";
import { parsePossibleLargeNumber } from "../../utils/bigint.ts";
import { Stats, UserWallets } from "./types.ts";

const nobitexApi = ofetch.create({
  baseURL: "https://api.nobitex.ir",
  retry: 3,
  retryDelay: 500,
  timeout: 10_000,
});

class Nobitex implements BalanceFetcher, ValueFetcher {
  async fetchAssetValues(requestedAssets: string[]): Promise<AssetValue[]> {
    const response = await nobitexApi<Stats>(`/market/stats`, {
      query: {
        srcCurrency: requestedAssets.join(`,`),
        dstCurrency: "usdt",
      },
    });

    const entries = Object.entries(response.stats);

    return entries.map(([key, value]) => {
      const [src, dest] = key.split("-");

      return {
        name: src,
        value: parseFloat(value.latest),
      } as AssetValue;
    });
  }
  async fetchUserBalances(apiKey: string): Promise<Balance[]> {
    const userWallets = await nobitexApi<UserWallets>("/users/wallets/list", {
      headers: {
        Authorization: `Token ${apiKey}`,
      },
    });

    return userWallets.wallets.map(
      (wallet) =>
        ({
          name: wallet.currency,
          quantity: parsePossibleLargeNumber(wallet.balance),
        } satisfies Balance)
    );
  }
}

export default new Nobitex();

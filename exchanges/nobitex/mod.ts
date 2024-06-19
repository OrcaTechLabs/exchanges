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
  timeout: 3000,
});

class Nobitex implements BalanceFetcher, ValueFetcher {
  fetchAssetValues(requestedAssets: string[]): Promise<AssetValue[]> {
    const promises = requestedAssets.map(async (asset) => {
      const assetValue = await nobitexApi<Stats>(`/market/stats`, {
        query: {
          srcCurrency: asset,
          dstCurrency: "usdt",
        },
      });
      console.log(assetValue);
      return {
        name: asset,
        value: parseFloat(assetValue.stats[`${asset}-usdt`].latest),
      } as AssetValue;
    });

    return Promise.all(promises);
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

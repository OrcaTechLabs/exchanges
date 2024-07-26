import { IntegrationMetadata } from "../../interfaces/general.interface.ts";
import {
  TransactionFetcher,
  Transaction,
  Balance,
  BalanceFetcher,
  AssetValue,
  ValueFetcher,
  KnownAsset,
  FormattedUdf,
  UdfFetcherConfig,
  TransactionType,
} from "../../interfaces/mod.ts";
import { UdfFetcher } from "../../interfaces/udf-fetcher.interface.ts";
import { ofetch } from "../../libs/ofetch.ts";
import { parsePossibleLargeNumber } from "../../utils/bigint.ts";
import { pipe } from "../../utils/pipe.ts";
import { configMap } from "./asset-config.ts";
import { metadataSchema } from "./schema.ts";
import {
  RawUdfResponse,
  Stats,
  UserTransaction,
  UserTransactions,
  UserWallets,
} from "./types.ts";
import { formatTransaction, processPrice, processType } from "./utils.ts";

const nobitexApi = ofetch.create({
  baseURL: "https://api.nobitex.ir",
  retry: 3,
  retryDelay: 2 * 60 * 1_000 /* 2 minutes */,
  timeout: 10_000,
});

class Nobitex
  implements BalanceFetcher, ValueFetcher, TransactionFetcher, UdfFetcher
{
  async fetchUdf(config: UdfFetcherConfig): Promise<FormattedUdf[]> {
    const TWO_DAYS_IN_SECONDS = 2 * 24 * 60 * 60;
    const { from, to, symbol, resolution } = config;

    const fetchInterval = async (
      start: number,
      end: number
    ): Promise<FormattedUdf[]> => {
      const UdfResponse = await nobitexApi<RawUdfResponse>(
        "/market/udf/history",
        {
          query: {
            symbol,
            resolution,
            from: start,
            to: end,
          },
          timeout: 2_000,
          retryDelay: 1_000,
        }
      );

      return UdfResponse.t.map(
        (time, index) =>
          ({
            time: time,
            open: UdfResponse.o[index],
            high: UdfResponse.h[index],
            low: UdfResponse.l[index],
            close: UdfResponse.c[index],
            volume: UdfResponse.v[index],
          } satisfies FormattedUdf)
      );
    };

    const intervals: { start: number; end: number }[] = [];
    for (let start = from; start < to; start += TWO_DAYS_IN_SECONDS) {
      const end = Math.min(start + TWO_DAYS_IN_SECONDS, to);
      intervals.push({ start, end });
    }

    const results = await Promise.all(
      intervals.map((interval) => fetchInterval(interval.start, interval.end))
    );
    return results.flat();
  }

  private validateMetadata(metadata: IntegrationMetadata) {
    return metadataSchema.parse(metadata);
  }

  private findMatchingAsset(
    wallet: UserWallets["wallets"][0],
    assets: KnownAsset[]
  ) {
    return assets.find((asset) => {
      if (asset.name === wallet.currency.toLowerCase()) {
        return true;
      }
      return asset.aliases.some(
        (alias) => alias === wallet.currency.toLowerCase()
      );
    });
  }
  private fetchTransactionsUntilIdIsFound = async (
    apiKey: string,
    config: {
      lastTransactionId: number;
      walletId: number;
    }
  ) => {
    let transactions: UserTransaction[] = [];
    let hasNext = true;
    while (hasNext) {
      const userTransactions = await nobitexApi<UserTransactions>(
        "/users/wallets/transactions/list",
        {
          headers: {
            Authorization: `Token ${apiKey}`,
          },
          query: {
            pageSize: 100,
            wallet: config.walletId,
            page: transactions.length / 100 + 1,
          },
        }
      );
      const newTransactions = userTransactions.transactions.filter(
        (transaction) => transaction.id > config.lastTransactionId
      );

      transactions = transactions.concat(newTransactions);

      const targetTransaction = userTransactions.transactions.find(
        (transaction) => transaction.id === config.lastTransactionId
      );
      if (targetTransaction) {
        return transactions;
      }

      hasNext = userTransactions.hasNext ?? false;
    }

    return transactions;
  };

  async fetchUserTransactions(
    IntegrationMetadata: IntegrationMetadata,
    config: {
      latestAssetTransactionRecords: Transaction[] | null;
      supportedAssets: KnownAsset[];
    }
  ): Promise<Transaction[]> {
    const { api_key } = this.validateMetadata(IntegrationMetadata);
    const userWallets = await nobitexApi<UserWallets>("/users/wallets/list", {
      headers: {
        Authorization: `Token ${api_key}`,
      },
    });

    const updatedWallets = userWallets.wallets.filter((wallet) => {
      const matchingAsset = this.findMatchingAsset(
        wallet,
        config.supportedAssets
      );
      const latestTransaction = config.latestAssetTransactionRecords?.find(
        (transaction) => transaction.asset_name === matchingAsset?.name
      );
      const balance = parsePossibleLargeNumber(wallet.balance);
      return latestTransaction?.balance !== balance;
    });

    const promises = updatedWallets.map(async (wallet) => {
      const matchingAsset = this.findMatchingAsset(
        wallet,
        config.supportedAssets
      );
      if (!matchingAsset) {
        return Promise.resolve([] as Transaction[]);
      }
      const latestTransaction = config.latestAssetTransactionRecords?.find(
        (transaction) => transaction.asset_name === matchingAsset?.name
      );

      const userTransactions = await this.fetchTransactionsUntilIdIsFound(
        api_key,
        {
          lastTransactionId:
            (latestTransaction?.meta.nobitex_id as number) ?? 0,
          walletId: wallet.id,
        }
      );
      const formattedTransactions: Transaction[] = [];
      for (const transaction of userTransactions) {
        const formattedTransaction: Transaction = pipe(
          transaction,
          formatTransaction,
          processType,
          processPrice
        );

        const currencyConfig = configMap.get(transaction.currency);
        if (!currencyConfig) {
          formattedTransaction.price = null;
          formattedTransactions.push(formattedTransaction);
          continue;
        }

        if (currencyConfig.isRoot) {
          formattedTransaction.price = 1;
          formattedTransactions.push(formattedTransaction);
          continue;
        }

        const udfEntry = await this.fetchUdf({
          from: formattedTransaction.time.getTime() / 1000 - 60,
          to: formattedTransaction.time.getTime() / 1000,
          resolution: "1",
          symbol: currencyConfig.symbol!,
        });
        formattedTransaction.price =
          (currencyConfig.isInverted
            ? 1 / udfEntry[0].close
            : udfEntry[0].close) * (currencyConfig.multiplier ?? 1);
        formattedTransactions.push(formattedTransaction);
      }

      return formattedTransactions;
    });

    return (await Promise.all(promises)).flat();
  }

  async fetchAssetValues(): Promise<AssetValue[]> {
    const response = await nobitexApi<Stats>(`/market/stats`, {
      query: {
        srcCurrency:
          "btc,usdt,eth,etc,doge,ada,bch,ltc,bnb,eos,xlm,xrp,trx,uni,link,dai,dot,shib,aave,ftm,matic,axs,mana,sand,avax,usdc,gmt,mkr,sol,atom,grt,bat,near,ape,qnt,chz,xmr,egala,busd,algo,hbar,1inch,yfi,flow,snx,enj,crv,fil,wbtc,flr,ldo,dydx,apt,mask,comp,bal,lrc,lpt,ens,sushi,api3,one,glm,pmn,dao,cvc,nmr,storj,snt,ant,zrx,slp,egld,imx,blur,100k_floki,1b_babydoge,1m_nft,1m_btt,t,celr,arb,magic,gmx,band,cvx,ton,ssv,mdt,omg,wld,rdnt,jst,bico,rndr,woo,skl,gal,agix,fet,not,trb,1m_pepe,rsr,ethfi,agld,aevo,om",
        dstCurrency: "usdt,rls",
      },
    });

    const entries = Object.entries(response.stats);

    const results: AssetValue[] = [];
    for (const entry of entries) {
      const [key, rawValue] = entry;
      const [src, dsc] = key.split("-");
      const value = parseFloat(rawValue.latest);

      if (key === "usdt-rls") {
        results.push({
          name: "rls",
          value: 1 / value,
        });
      } else if (dsc === "rls" || isNaN(value)) {
        continue;
      } else {
        results.push({
          name: src,
          value: value,
        });
      }
    }
    return results;
  }

  async fetchUserBalances(
    IntegrationMetadata: IntegrationMetadata
  ): Promise<Balance[]> {
    const { api_key } = this.validateMetadata(IntegrationMetadata);

    const userWallets = await nobitexApi<UserWallets>("/users/wallets/list", {
      headers: {
        Authorization: `Token ${api_key}`,
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

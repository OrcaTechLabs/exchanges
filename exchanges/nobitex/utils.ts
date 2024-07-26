import { parsePossibleLargeNumber } from "../../utils/bigint.ts";
import { configMap } from "./asset-config.ts";
import { UserTransaction } from "./types.ts";

function extractPriceAndUnit(input: string): {
  price: number | null;
  unit: string | null;
} {
  const regex = /به قیمت واحد ([\d,]+) (\S+)/;
  const match = input.match(regex);

  if (match) {
    let price = match[1];
    const unit = match[2];

    price = price.replace(/,/g, "");

    const priceNumber = parseFloat(price);

    return { price: priceNumber, unit };
  }

  return {
    price: null,
    unit: null,
  };
}

const formatTransaction = (transaction: UserTransaction) => {
  const assetConfig = configMap.get(transaction.currency);

  return {
    time: new Date(transaction.created_at),
    type: transaction.amount.startsWith("-") ? "sell" : "buy",
    asset_name: assetConfig?.baseAsset ?? transaction.currency,
    quantity: parsePossibleLargeNumber(transaction.amount.replace(/^-/, "")),
    price: null,
    balance: parsePossibleLargeNumber(transaction.balance),
    meta: {
      nobitex_id: transaction.id,
      description: transaction.description,
    },
  } as const;
};

const processType = (transaction: ReturnType<typeof formatTransaction>) => {
  const description = transaction.meta.description;

  if (description.includes("خرید")) {
    return { ...transaction, type: "buy" } as const;
  }

  if (description.includes("فروش")) {
    return { ...transaction, type: "sell" } as const;
  }

  if (description.includes("واریز")) {
    return { ...transaction, type: "deposit" } as const;
  }

  if (description.includes("برداشت")) {
    return { ...transaction, type: "withdrawal" } as const;
  }

  return transaction;
};

const processPrice = (transaction: ReturnType<typeof processType>) => {
  const description = transaction.meta.description;

  const priceAndUnit = extractPriceAndUnit(description) ?? {};

  return { ...transaction, meta: { ...transaction.meta, ...priceAndUnit } };
};

export { formatTransaction, processType, processPrice };

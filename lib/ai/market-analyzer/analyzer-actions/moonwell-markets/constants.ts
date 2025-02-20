export type TokenConfig = {
  address: `0x${string}`;
  decimals: number;
  name: string;
  symbol: string;
};

export class Amount {
  //Used in serialization
  public _className = "Amount";
  public value = 0;
  public exponential = 0n;
  public base = 0;

  /**
   * Creates an instance of Amount.
   * This class is helpful with exponential values by creating the amount representation as number and as a bigint, converted using a base.
   * @param value - The value of the amount.
   * @param base - The exponential base of the amount.
   * @returns new Amount class with the value as a number, the exponential number as a bigint and the base used in the conversion
   */
  constructor(value: bigint | number, base: number) {
    this.base = base;
    if (typeof value === "bigint") {
      this.exponential = value;
      this.value = Number(value) / Number(10n ** BigInt(this.base));
    } else {
      this.value = value;
      this.exponential = BigInt(Math.floor(value * 10 ** this.base));
    }
  }

  public toString() {
    return this.value.toFixed(this.base);
  }

  public toBigString() {
    return this.exponential.toString();
  }
}

export type MarketReward = {
  token: TokenConfig;
  supplyApr: number;
  borrowApr: number;
  liquidStakingApr: number;
};
export type Market = {
  marketKey: string;
  chainId: number;
  deprecated: boolean;
  mintPaused: boolean;
  borrowPaused: boolean;
  seizePaused: boolean;
  transferPaused: boolean;
  marketToken: TokenConfig;
  underlyingToken: TokenConfig;
  collateralFactor: number;
  underlyingPrice: number;
  supplyCaps: Amount;
  supplyCapsUsd: number;
  borrowCaps: Amount;
  borrowCapsUsd: number;
  badDebt: Amount;
  badDebtUsd: number;
  totalSupply: Amount;
  totalSupplyUsd: number;
  totalBorrows: Amount;
  totalBorrowsUsd: number;
  totalReserves: Amount;
  totalReservesUsd: number;
  cash: Amount;
  exchangeRate: number;
  reserveFactor: number;
  baseSupplyApy: number;
  baseBorrowApy: number;
  totalSupplyApr: number;
  totalBorrowApr: number;
  rewards: MarketReward[];
};

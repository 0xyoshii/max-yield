import type { Address } from "viem";

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

export type MorphoReward = {
  marketId: string | undefined;
  asset: TokenConfig;
  supplyApr: number;
  supplyAmount: number;
  borrowApr: number;
  borrowAmount: number;
};

export type MorphoMarketParamsType = {
  loanToken: Address;
  collateralToken: Address;
  irm: Address;
  lltv: bigint;
  oracle: Address;
};

export type PublicAllocatorSharedLiquidityType = {
  assets: string;
  vault: {
    address: string;
    name: string;
    publicAllocatorConfig: {
      fee: number;
      flowCaps: {
        market: {
          uniqueKey: string;
        };
        maxIn: string;
        maxOut: string;
      }[];
    };
  };
  allocationMarket: {
    uniqueKey: string;
    loanAsset: {
      address: string;
    };
    collateralAsset?: {
      address: string;
    };
    oracleAddress: string;
    irmAddress: string;
    lltv: string;
  };
};

export type MorphoVaultMarket = {
  allocation: number;
  marketId: string;
  marketCollateral: TokenConfig;
  marketApy: number;
  marketLiquidity: Amount;
  marketLiquidityUsd: number;
  marketLoanToValue: number;
  totalSupplied: Amount;
  totalSuppliedUsd: number;
  rewards: Omit<MorphoReward, "marketId">[];
};

export type MorphoVaultSnapshot = {
  chainId: number;
  vaultAddress: string;
  totalSupply: number;
  totalSupplyUsd: number;
  totalBorrows: number;
  totalBorrowsUsd: number;
  totalLiquidity: number;
  totalLiquidityUsd: number;
  timestamp: number;
};

export type MorphoVault = {
  chainId: number;
  vaultKey: string;
  vaultToken: TokenConfig;
  underlyingToken: TokenConfig;
  vaultSupply: Amount;
  totalSupply: Amount;
  totalSupplyUsd: number;
  totalLiquidity: Amount;
  totalLiquidityUsd: number;
  underlyingPrice: number;
  baseApy: number;
  rewardsApy: number;
  totalApy: number;
  performanceFee: number;
  curators: string[];
  timelock: number;
  markets: MorphoVaultMarket[];
  rewards: Omit<MorphoReward, "marketId">[];
};
import type { Market } from "@/lib/ai/market-analyzer/analyzer-actions/moonwell-markets/constants";
import type { MorphoVault } from "@/lib/ai/market-analyzer/analyzer-actions/morpho-markets/constants";

type AllocationParams = { 
  amount: number;
  moonwellData: Market;
  morphoData: MorphoVault;
  onProgress: (message: string) => Promise<void>;
};

export type Allocation = {
  protocol: string;
  vault: string;
  amount: number;
  apy: string;
};

export type AllocationResult = {
  total: number;
  allocations: Allocation[];
};

interface PoolData {
  protocol: string;
  vault: string;
  supplyApy: number;
  utilizationRate: number;
  availableLiquidity: number;
  riskScore: number;
}

function calculateUtilizationRate(totalBorrows: number, totalSupply: number): number {
  if (totalSupply === 0) return 0;
  return (totalBorrows / totalSupply) * 100;
}

function calculateRiskScore(utilizationRate: number, loanToValue: number = 0.8): number {
  // Higher score = lower risk
  // Penalize high utilization and high LTV
  const utilizationPenalty = utilizationRate > 80 ? (utilizationRate - 80) * 0.1 : 0;
  const ltvPenalty = loanToValue > 0.8 ? (loanToValue - 0.8) * 10 : 0;
  
  return 10 - utilizationPenalty - ltvPenalty;
}

function calculateAvailableLiquidity(totalSupplyUsd: number, totalBorrowsUsd: number): number {
  return Math.max(0, totalSupplyUsd - totalBorrowsUsd);
}

// Add intermediate allocation type with percentage
interface AllocationWithPercentage extends Allocation {
  percentage: number;
}

export async function analyzeAndAllocate({
  amount,
  moonwellData,
  morphoData,
  onProgress
}: AllocationParams): Promise<AllocationResult> {
  await onProgress("Analyzing market conditions...");

  // Calculate scores for each market
  function calculateMarketScore(pool: PoolData): number {
    // Weight factors: APY (50%), Risk (30%), Utilization (20%)
    return (pool.supplyApy * 0.5) + 
           (pool.riskScore * 0.3) + 
           ((100 - pool.utilizationRate) * 0.002);
  }

  // Extract and score Moonwell market
  const moonwellPool: PoolData = {
    protocol: "moonwell",
    vault: moonwellData.marketKey,
    supplyApy: (moonwellData.baseSupplyApy || 0) + (moonwellData.totalSupplyApr || 0),
    utilizationRate: calculateUtilizationRate(
      moonwellData.totalBorrowsUsd || 0,
      moonwellData.totalSupplyUsd || 0
    ),
    availableLiquidity: calculateAvailableLiquidity(
      moonwellData.totalSupplyUsd || 0,
      moonwellData.totalBorrowsUsd || 0
    ),
    riskScore: calculateRiskScore(
      calculateUtilizationRate(
        moonwellData.totalBorrowsUsd || 0,
        moonwellData.totalSupplyUsd || 0
      ),
      moonwellData.collateralFactor || 0.8
    )
  };

  // Extract and score Morpho market
  const morphoPool: PoolData = {
    protocol: "morpho",
    vault: morphoData.vaultKey,
    // For Morpho vaults, use the total APY which includes base + rewards
    supplyApy: morphoData.totalApy || 0,
    utilizationRate: calculateUtilizationRate(
      morphoData.totalSupply.value || 0,
      morphoData.totalLiquidity.value || 0
    ),
    availableLiquidity: morphoData.totalLiquidityUsd || 0,
    riskScore: 10 // Morpho vaults are considered safe as they're curated
  };

  // Only proceed with Morpho if it's a USDC vault
  if (morphoData.underlyingToken.symbol.toUpperCase() !== "USDC") {
    await onProgress("Skipping Morpho vault as it's not a USDC vault");
    return {
      total: amount,
      allocations: [{
        protocol: moonwellPool.protocol,
        vault: moonwellPool.vault,
        amount: amount,
        apy: `${moonwellPool.supplyApy.toFixed(2)}%`
      }]
    };
  }

  // Log market metrics in compact format
  await onProgress(`Market Analysis:
Moonwell | APY: ${moonwellPool.supplyApy.toFixed(2)}% | Util: ${moonwellPool.utilizationRate.toFixed(1)}% | Risk: ${moonwellPool.riskScore.toFixed(1)}/10 | Liquidity: $${(moonwellPool.availableLiquidity / 1e6).toFixed(2)}M
Morpho   | APY: ${morphoPool.supplyApy.toFixed(2)}% | Util: ${morphoPool.utilizationRate.toFixed(1)}% | Risk: ${morphoPool.riskScore.toFixed(1)}/10 | Liquidity: $${(morphoPool.availableLiquidity / 1e6).toFixed(2)}M`);

  // Calculate scores for each pool
  const moonwellScore = calculateMarketScore(moonwellPool);
  const morphoScore = calculateMarketScore(morphoPool);

  // Calculate allocation based on relative scores
  const totalScore = moonwellScore + morphoScore;
  const allocations: Allocation[] = [];

  if (totalScore > 0) {
    // Calculate proportional allocations
    const moonwellAllocation = (moonwellScore / totalScore) * amount;
    const morphoAllocation = (morphoScore / totalScore) * amount;

    // Add Moonwell allocation
    if (moonwellScore > 0) {
      allocations.push({
        protocol: moonwellPool.protocol,
        vault: moonwellPool.vault,
        amount: Math.min(moonwellAllocation, moonwellPool.availableLiquidity || 0),
        apy: `${moonwellPool.supplyApy.toFixed(2)}%`
      });
    }

    // Add Morpho allocation
    if (morphoScore > 0) {
      allocations.push({
        protocol: morphoPool.protocol,
        vault: morphoPool.vault,
        amount: Math.min(morphoAllocation, morphoPool.availableLiquidity || 0),
        apy: `${morphoPool.supplyApy.toFixed(2)}%`
      });
    }

    // Normalize allocations to match input amount
    const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
    if (totalAllocated > 0) {
      const scaleFactor = amount / totalAllocated;
      const finalAllocations = allocations.map(alloc => ({
        ...alloc,
        amount: alloc.amount * scaleFactor
      }));

      await onProgress(`Allocation Strategy (Score-based: Moonwell ${moonwellScore.toFixed(1)} vs Morpho ${morphoScore.toFixed(1)}):
${finalAllocations.map(a => `${a.protocol}: ${(a.amount / amount * 100).toFixed(1)}% (${formatAmount(a.amount)} ETH)`).join(' | ')}`);

      return {
        total: amount,
        allocations: finalAllocations
      };
    }
  }

  // Fallback to 50-50 split if scores are invalid
  await onProgress("Using default 50-50 allocation strategy");
  return {
    total: amount,
    allocations: [
      {
        protocol: moonwellPool.protocol,
        vault: moonwellPool.vault,
        amount: amount * 0.5,
        apy: `${moonwellPool.supplyApy.toFixed(2)}%`
      },
      {
        protocol: morphoPool.protocol,
        vault: morphoPool.vault,
        amount: amount * 0.5,
        apy: `${morphoPool.supplyApy.toFixed(2)}%`
      }
    ]
  };
}

// Helper function for amount formatting
function formatAmount(num: number): string {
  return num.toFixed(6);
}

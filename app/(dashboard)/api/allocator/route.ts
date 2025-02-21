import { NextResponse } from "next/server";
import { initializeMarketAnalyzer, type Market, type MorphoVault, type AnalyzerError } from "@/lib/ai/market-analyzer-agent";
import { initializeMarketOperator } from "@/lib/ai/market-operator-agent";
import { analyzeAndAllocate } from "@/lib/ai/allocator/allocator";
import { auth } from "@/app/(auth)/auth";
import { privateKeyToAccount } from "viem/accounts";

// USDC token address on Base
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_DECIMALS = 6;

// Types for protocol-specific deposit parameters
type MoonwellDepositParams = {
  protocol: "moonwell";
  assets: string;
  tokenAddress: string;
  mTokenAddress: string;
};

type MorphoDepositParams = {
  protocol: "morpho";
  amount: string;
  tokenAddress: string;
  vaultAddress: string;
  receiver: string;
};

type DepositParams = MoonwellDepositParams | MorphoDepositParams;

// Helper function to handle BigInt serialization
function serializeWithBigInt(obj: any): string {
  return JSON.stringify(obj, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
}

// Helper function to format amount to decimal string with proper precision
function formatToWholeUnits(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error(`Invalid amount: ${amount}`);
  }
  
  // Convert to fixed 2 decimal places first
  const amountWith2Decimals = Number(amount.toFixed(2));
  
  // Convert to base units (multiply by 10^6 for USDC)
  const baseUnits = Math.floor(amountWith2Decimals * 1e6);
  
  // Convert back to decimal representation with exactly 2 decimal places
  return (baseUnits / 1e6).toFixed(2);
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.privateKey) {
      return new Response('Unauthorized or missing private key', { status: 401 });
    }

    // Get the wallet address from the private key
    const account = privateKeyToAccount(session.user.privateKey as `0x${string}`);
    const walletAddress = account.address;

    const { amount } = await req.json();

    // Create a stream for progress updates
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start the analysis pipeline
    const runAnalysis = async () => {
      try {
        // Initialize market analyzer for data fetching
        const analyzer = await initializeMarketAnalyzer({
          network: "base-mainnet",
          privateKey: session.user.privateKey as `0x${string}`,
        });

        // Get market data
        await writer.write(encoder.encode("Fetching market data...\n"));
        
        // Get raw market data using the analyzer
        await writer.write(encoder.encode("\nAnalyzing markets...\n"));
        const moonwellData = await analyzer({ 
          protocol: "moonwell", 
          asset: "USDC"
        });
        await writer.write(encoder.encode(`Moonwell market:
- APY: ${moonwellData.baseSupplyApy}%
- Total Supply: ${moonwellData.totalSupplyUsd} USD\n`));

        const morphoData = await analyzer({ 
          protocol: "morpho", 
          asset: "USDC"
        });
        await writer.write(encoder.encode(`Morpho market:
- APY: ${morphoData.totalApy}%
- Total Supply: ${morphoData.totalSupplyUsd} USD\n`));

        // Log the initial amount
        await writer.write(encoder.encode(`\nProcessing deposit amount: ${amount} USDC\n`));

        // Analyze and allocate funds
        await writer.write(encoder.encode("\nCalculating optimal allocation...\n"));
        const allocation = await analyzeAndAllocate({
          amount: Math.floor(amount * 1e6),
          moonwellData,
          morphoData,
          onProgress: async (message) => {
            await writer.write(encoder.encode(message + "\n"));
          }
        });

        // Log allocation details
        await writer.write(encoder.encode("\nAllocation plan:\n"));
        allocation.allocations.forEach(async (alloc) => {
          const amountInUsdc = formatToWholeUnits(alloc.amount / 1e6);
          await writer.write(encoder.encode(`- ${alloc.protocol}: ${amountInUsdc} USDC\n`));
        });

        // Initialize operator for deposits
        await writer.write(encoder.encode("\nProcessing deposits...\n"));
        const operator = await initializeMarketOperator({
          network: "base-mainnet",
          privateKey: session.user.privateKey as `0x${string}`,
        });

        // Execute the deposits using the analyzed data
        const depositResults = await Promise.all(
          allocation.allocations.map(async (alloc) => {
            if (alloc.amount <= 0) return null;

            let wholeUnits: string;
            try {
              wholeUnits = formatToWholeUnits(alloc.amount / 1e6);
              await writer.write(encoder.encode(`Processing ${alloc.protocol} deposit: ${wholeUnits} USDC\n`));
            } catch (error) {
              const errorMsg = `Error converting amount: ${error instanceof Error ? error.message : 'Unknown error'}`;
              await writer.write(encoder.encode(errorMsg + '\n'));
              throw error;
            }
            
            try {
              if (alloc.protocol === "moonwell") {
                await operator({
                  protocol: "moonwell",
                  amount: wholeUnits,
                  destinationAddress: walletAddress
                });
                return `✓ Deposited ${wholeUnits} USDC to Moonwell`;
              } 
              
              if (alloc.protocol === "morpho") {
                await operator({
                  protocol: "morpho",
                  amount: wholeUnits,
                  vaultAddress: morphoData.markets[0].marketId,
                  receiverAddress: walletAddress
                });
                return `✓ Deposited ${wholeUnits} USDC to Morpho`;
              }
            } catch (error) {
              const errorMsg = `Error in ${alloc.protocol} deposit: ${error instanceof Error ? error.message : 'Unknown error'}`;
              await writer.write(encoder.encode(errorMsg + '\n'));
              throw error;
            }
          })
        );

        // Log final results
        await writer.write(encoder.encode("\nResults:\n"));
        depositResults
          .filter(Boolean)
          .forEach(async (result) => {
            await writer.write(encoder.encode(`${result}\n`));
          });

        // Send final allocation with minimal market details
        await writer.write(encoder.encode(serializeWithBigInt({ 
          type: 'result', 
          allocation: {
            allocations: allocation.allocations.map(alloc => ({
              protocol: alloc.protocol,
              amount: alloc.amount,
              amountFormatted: formatToWholeUnits(alloc.amount / 1e6)
            }))
          }
        }) + "\n"));
        await writer.close();

      } catch (error) {
        console.error("Analysis error:", error);
        const errorMessage = (error as Error).message || 'An unexpected error occurred';
        await writer.write(encoder.encode(`Error: ${errorMessage}\n`));
        await writer.close();
        throw error;
      }
    };

    // Run the analysis in the background
    runAnalysis();

    // Return the stream
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error("Route error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

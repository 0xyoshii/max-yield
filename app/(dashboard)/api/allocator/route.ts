import { NextResponse } from "next/server";
import { initializeMarketAnalyzer, type Market, type MorphoVault, AnalyzerError } from "@/lib/ai/market-analyzer";
import { analyzeAndAllocate } from "@/lib/ai/allocator/allocator";
import { auth } from "@/app/(auth)/auth";

// Helper function to handle BigInt serialization
function serializeWithBigInt(obj: any): string {
  return JSON.stringify(obj, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.privateKey) {
      return new Response('Unauthorized or missing private key', { status: 401 });
    }

    const { amount } = await req.json();

    // Create a stream for progress updates
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start the analysis pipeline
    const runAnalysis = async () => {
      try {
        // Initialize market analyzer
        const analyzer = await initializeMarketAnalyzer({
          network: "base-mainnet",
          privateKey: session.user.privateKey as `0x${string}`,
        });

        // Get market data
        await writer.write(encoder.encode("Fetching market data...\n"));
        
        // Get raw market data
        const moonwellData = await analyzer({ protocol: "moonwell", asset: "USDC" });
        const morphoData = await analyzer({ protocol: "morpho", asset: "USDC" });

        // Log basic market info
        await writer.write(encoder.encode(`Found markets:
- Moonwell: ${moonwellData.marketKey}
- Morpho: ${morphoData.vaultKey}\n`));

        // Analyze and allocate funds
        const allocation = await analyzeAndAllocate({
          amount,
          moonwellData,
          morphoData,
          onProgress: async (message) => {
            await writer.write(encoder.encode(message + "\n"));
          }
        });

        // Send final allocation
        await writer.write(encoder.encode(JSON.stringify({ type: 'result', allocation }) + "\n"));
        await writer.close();

      } catch (error) {
        console.error("Analysis error:", error);
        const errorMessage = error instanceof AnalyzerError ? error.message : 'An unexpected error occurred';
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

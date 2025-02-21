import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { createPublicClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

// USDC token contract ABI for balanceOf
const USDC_ABI = parseAbi([
  "function balanceOf(address owner) view returns (uint256)"
]);

// Base USDC address
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

// Get Alchemy API key from environment variable
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

if (!ALCHEMY_API_KEY) {
  throw new Error('Missing ALCHEMY_API_KEY environment variable');
}

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.privateKey) {
      return new Response('Unauthorized or missing private key', { status: 401 });
    }

    // Get the wallet address from the private key
    const account = privateKeyToAccount(session.user.privateKey as `0x${string}`);
    const address = account.address;

    // Create a public client with Alchemy provider
    const client = createPublicClient({
      chain: base,
      transport: http(`https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`)
    });

    // Get ETH balance
    const ethBalance = await client.getBalance({ address });

    // Get USDC balance
    const usdcBalance = await client.readContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [address]
    });

    return NextResponse.json({
      address,
      ethBalance: Number(ethBalance) / 1e18, // Convert from wei to ETH
      usdcBalance: Number(usdcBalance) // Already in USDC decimals (6)
    });

  } catch (error) {
    console.error("Failed to get wallet info:", error);
    return NextResponse.json(
      { error: "Failed to get wallet information" },
      { status: 500 }
    );
  }
} 
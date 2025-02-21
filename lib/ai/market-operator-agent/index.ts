import { 
  AgentKit, 
  moonwellActionProvider,
  morphoActionProvider,
  wethActionProvider,
  ViemWalletProvider,
  type Action
} from "@coinbase/agentkit";

import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { z } from "zod";

import { DEFAULT_NETWORK, SUPPORTED_NETWORKS } from "../../networks";

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

// Re-export the types

export class AnalyzerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnalyzerError';
  }
}

/**
* Initialize the market operator that handles deposits and withdrawals
*
* @returns Function that executes market operations
* @throws Error if initialization fails
*/
export async function initializeMarketOperator({
  network,
  privateKey
}: {
  network: string;
  privateKey: `0x${string}`;
}) {
  try {
    const account = privateKeyToAccount(privateKey);

    const client = createWalletClient({
      account,
      chain: SUPPORTED_NETWORKS.find(n => n.name === network) || DEFAULT_NETWORK,
      transport: http(),
    });

    const walletProvider = new ViemWalletProvider(client);

    const agentKit = await AgentKit.from({ 
      walletProvider,
      actionProviders: [
        moonwellActionProvider(),
        morphoActionProvider(),
        wethActionProvider()
      ],
    });

    const actions = agentKit.getActions();
    
    // Create a map of available actions for quick lookup

    return async function deposit(input: { 
      protocol: "moonwell" | "morpho";
      amount: string;
      destinationAddress?: string;  // For Moonwell
      vaultAddress?: string;        // For Morpho
      receiverAddress?: string;     // For Morpho
    }) {
      const { protocol, amount } = input;
      
      try {
        if (protocol === "moonwell") {
          if (!input.destinationAddress) {
            throw new AnalyzerError("Destination address is required for Moonwell deposits");
          }

          const moonwellAction = actions.find(a => a.name === "MoonwellActionProvider_mint");
          if (!moonwellAction) {
            throw new AnalyzerError("Moonwell mint action not found");
          }

          return await moonwellAction.invoke({
            destinationAddress: input.destinationAddress,
            amount,
            tokenToApprove: USDC_ADDRESS
          });

        } else if (protocol === "morpho") {
          if (!input.vaultAddress || !input.receiverAddress) {
            throw new AnalyzerError("Vault address and receiver address are required for Morpho deposits");
          }

          const morphoAction = actions.find(a => a.name === "MorphoActionProvider_deposit");
          if (!morphoAction) {
            throw new AnalyzerError("Morpho deposit action not found");
          }

          return await morphoAction.invoke({
            vaultAddress: input.vaultAddress,
            amount,
            receiverAddress: input.receiverAddress,
            tokenToApprove: USDC_ADDRESS
          });

        } else {
          throw new AnalyzerError(`Unsupported protocol: ${protocol}`);
        }

      } catch (error) {
        if (error instanceof AnalyzerError) {
          throw error;
        }
        throw new AnalyzerError(`Error processing deposit: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

  } catch (error) {
    throw new AnalyzerError(`Failed to initialize market operator: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
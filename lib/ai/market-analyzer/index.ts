import { 
  AgentKit, 
  ViemWalletProvider,
  type Action
} from "@coinbase/agentkit";
import { moonwellMarketsActionProvider } from "./analyzer-actions/moonwell-markets/moonwellMarketsActionProvider";
import { morphoVaultsActionProvider } from "./analyzer-actions/morpho-markets/morphoMarketsActionProvider";
import type { Market } from "./analyzer-actions/moonwell-markets/constants";
import type { MorphoVault } from "./analyzer-actions/morpho-markets/constants";

import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { z } from "zod";

import { DEFAULT_NETWORK, SUPPORTED_NETWORKS } from "../../networks";

// Re-export the types
export type { Market, MorphoVault };

export class AnalyzerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnalyzerError';
  }
}

/**
* Initialize the market analyzer that processes input and returns structured market data
*
* @returns Function that analyzes market data
* @throws Error if initialization fails
*/
export async function initializeMarketAnalyzer({
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
        moonwellMarketsActionProvider(),
        morphoVaultsActionProvider()
      ],
    });

    const actions = agentKit.getActions();
    
    // Create a map of available actions for quick lookup
    const actionMap = actions
      .filter(action => action.name.startsWith('MoonwellMarketsActionProvider_moonwell.') || action.name.startsWith('MorphoVaultsActionProvider_morpho.'))
      .reduce((map, action) => {
        map.set(action.name, action);
        return map;
      }, new Map<string, any>());

    return async function analyzeMarket<T extends "moonwell" | "morpho">(input: { protocol: T; asset: string }): Promise<T extends "moonwell" ? Market : MorphoVault> {
      const { protocol, asset } = input;
      
      try {
        let actionName: string;
        if (protocol === "moonwell") {
          actionName = "MoonwellMarketsActionProvider_moonwell.view_markets";
        } else if (protocol === "morpho") {
          actionName = "MorphoVaultsActionProvider_morpho.view_morpho_vaults";
        } else {
          throw new AnalyzerError(`Unsupported protocol: ${protocol}`);
        }

        const action = actionMap.get(actionName);
        if (!action) {
          throw new AnalyzerError(`Action not found: ${actionName}`);
        }

        const result = await action.invoke({ asset });

        // Filter for USDC markets and return the first one
        if (Array.isArray(result)) {
          const usdcMarket = result.find(market => {
            if (protocol === "moonwell") {
              return (market as Market).underlyingToken.symbol.toUpperCase() === asset.toUpperCase();
            } else {
              return (market as MorphoVault).underlyingToken.symbol.toUpperCase() === asset.toUpperCase();
            }
          });

          if (!usdcMarket) {
            throw new AnalyzerError(`No ${asset} market found for ${protocol}`);
          }

          return usdcMarket as T extends "moonwell" ? Market : MorphoVault;
        }

        throw new AnalyzerError(`Unexpected response format from ${protocol}`);
      } catch (error) {
        if (error instanceof AnalyzerError) {
          throw error;
        }
        throw new AnalyzerError(`Error analyzing market data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

  } catch (error) {
    throw new AnalyzerError(`Failed to initialize market analyzer: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
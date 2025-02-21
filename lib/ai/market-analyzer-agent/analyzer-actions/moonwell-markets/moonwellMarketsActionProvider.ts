import type { z } from "zod";

import { ActionProvider, CreateAction, EvmWalletProvider, MorphoActionProvider, Network } from "@coinbase/agentkit";
import { moonwellMarkets, moonwellMarket } from "./schemas";
import { moonwellClient } from "./client";
import { Market } from "./constants";
export const SUPPORTED_NETWORKS = ["base-mainnet"];


export class MoonwellMarketsActionProvider extends ActionProvider<EvmWalletProvider> {
  /**
   * Constructor for the MoonwellMarketsActionProvider class.
   */
  constructor() {
    super("moonwellMarkets", []);
  }

  @CreateAction({
    name: "moonwell.view_markets",
    description: `
  This tool allows you to view all the available markets on Moonwell. 

  It take (Defaults to USDC):
  - asset: The asset you want to view the markets of
    For example:
      markets for USDC
  `,
    schema: moonwellMarkets,
  })
  async viewMarkets(wallet: EvmWalletProvider, args: z.infer<typeof moonwellMarkets>): Promise<Market[] | string> {
    try {
      const allMarkets = await moonwellClient.getMarkets();
      
      const filteredMarkets = allMarkets.filter(
        market => market.underlyingToken.symbol.toUpperCase() === args.asset!.toUpperCase()
      );

      if (filteredMarkets.length === 0) {
        return `No markets found for asset: ${args.asset}`;
      }

      return filteredMarkets;
    } catch (error) {
      return `Error fetching markets: ${error}`;
    }
  }

  @CreateAction({
    name: "moonwell.view_market",
    description: `
  This tool allows you to view a specific market on Moonwell. 

  It takes:
  - contractAddress: The contract address of the market you want to view
    For example:
      0x1234567890123456789012345678901234567890
  `,
    schema: moonwellMarket,
  })
  async viewMarket(wallet: EvmWalletProvider, args: z.infer<typeof moonwellMarket>): Promise<Market | string> {
    try {
      const market = await moonwellClient.getMarket({
        chainId: 8453, 
        marketAddress: args.marketAddress as `0x${string}`,
      });
      
      if (!market) {
        return `No market found for address: ${args.marketAddress}`;
      }

      return market;
    } catch (error) {
      return `Error fetching market: ${error}`;
    }
  }


  /**
   * Checks if the Morpho action provider supports the given network.
   *
   * @param network - The network to check.
   * @returns True if the Morpho action provider supports the network, false otherwise.
   */
  supportsNetwork = (network: Network) =>
    network.protocolFamily === "evm" && SUPPORTED_NETWORKS.includes(network.networkId!);
}

export const moonwellMarketsActionProvider = () => new MoonwellMarketsActionProvider();
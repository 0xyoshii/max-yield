import type { z } from "zod";

import { ActionProvider, CreateAction, EvmWalletProvider, Network } from "@coinbase/agentkit";
import { morphoVaults, morphoVault } from "./schemas";
import { morphoClient } from "./client";
import type { MorphoVault } from "./constants";
export const SUPPORTED_NETWORKS = ["base-mainnet"];


export class MorphoVaultsActionProvider extends ActionProvider<EvmWalletProvider> {
  /**
   * Constructor for the MorphoMarketsActionProvider class.
   */
  constructor() {
    super("morphoVaults", []);
  }

  @CreateAction({
    name: "morpho.view_morpho_vaults",
    description: `
  This tool allows you to view all the available vaults on Morpho. 

  It takes (Defaults to USDC):
  - asset: The asset you want to view the markets of
    For example:
      markets for USDC
  `,
    schema: morphoVaults,
  })
  async viewVaults(wallet: EvmWalletProvider, args: z.infer<typeof morphoVaults>): Promise<MorphoVault[] | string> {
    try {
      const allVaults = await morphoClient.getMorphoVaults() as MorphoVault[];
      
      if (!args.asset) {
        return allVaults;
      }

      const filteredVaults = allVaults.filter(
        vault => 
          vault.vaultToken.symbol.toUpperCase() === args.asset!.toUpperCase() ||
          vault.underlyingToken.symbol.toUpperCase() === args.asset!.toUpperCase()
      );

      if (filteredVaults.length === 0) {
        return `No vaults found for asset: ${args.asset}`;
      }

      return filteredVaults;
    } catch (error) {
      return `Error fetching vaults: ${error}`;
    }
  }

  @CreateAction({
    name: "morpho.view_morpho_vault",
    description: `
  This tool allows you to view a specific vault on Morpho. 

  It takes:
  - vaultAddress: The vault address you want to view
    For example:
      0x8793cf302b8ffd655ab97bd1c695dbd967807e8367a65cb2f4edaf1380ba1bda
  `,
    schema: morphoVault,  
  })
  async viewVault(wallet: EvmWalletProvider, args: z.infer<typeof morphoVault>): Promise<MorphoVault | string> {
    try {
      const vault = await morphoClient.getMorphoVault({
        chainId: 8453,
        vaultAddress: args.vaultAddress as `0x${string}`,
      }) as MorphoVault;
      
      if (!vault) {
        return `No vault found for vault address: ${args.vaultAddress}`;
      }

      return vault;
    } catch (error) {
      return `Error fetching vault: ${error}`;
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

export const morphoVaultsActionProvider = () => new MorphoVaultsActionProvider();
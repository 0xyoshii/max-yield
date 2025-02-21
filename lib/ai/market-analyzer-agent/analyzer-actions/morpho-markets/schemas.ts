import { z } from "zod";


export const morphoVaults = z
  .object({
    asset: z
      .string()
      .optional()
      .describe("The asset of the vault you want to interact with (e.g. USDC)"),
  })
  .describe("Input schema for multiple Morpho Vaults fetching");


export const morphoVault = z
  .object({
    vaultAddress: z
      .string()
      .describe("The address of the vault you want to retrieve data of"),
  })
  .describe("Input schema for specific Morpho Vault fetching");
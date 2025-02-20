import { z } from "zod";


export const moonwellMarkets = z
  .object({
    asset: z
      .string()
      .optional()
      .describe("The asset of the vault you want to interact with (e.g. USDC)"),
  })
  .describe("Input schema for multiple Moonwell Markets fetching");


export const moonwellMarket = z
  .object({
    marketAddress: z
      .string()
      .describe("The address of the market you want to retrieve data of"),
  })
  .describe("Input schema for specific Moonwell Market fetching");
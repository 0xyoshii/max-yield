import { createMoonwellClient } from "@moonwell-fi/moonwell-sdk";
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
 
export const morphoClient = createMoonwellClient({
  networks: {
    base: {
      rpcUrls: [`https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`],
    }
  },
});
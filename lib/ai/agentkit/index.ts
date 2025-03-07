import { 
    AgentKit, 
    ViemWalletProvider, 
    cdpApiActionProvider, 
    erc721ActionProvider, 
    pythActionProvider, 
    walletActionProvider,
    basenameActionProvider,
    erc20ActionProvider,
    wethActionProvider,
    cdpWalletActionProvider,
    alchemyTokenPricesActionProvider,
    morphoActionProvider,
    moonwellActionProvider
} from "@coinbase/agentkit";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { getVercelAITools } from "./get-vercel-ai-tools";
import { DEFAULT_NETWORK, SUPPORTED_NETWORKS } from "../../networks";

/**
 * Initialize the agent with CDP Agentkit and Vercel AI SDK tools
 *
 * @returns Object containing initialized tools
 * @throws Error if initialization fails
 */
export async function initializeAgent({
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
          cdpApiActionProvider({
            apiKeyName: process.env.CDP_API_KEY_NAME,
            apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY,
          }),
          cdpWalletActionProvider({
            apiKeyName: process.env.CDP_API_KEY_NAME,
            apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY,
          }),
          erc721ActionProvider(),
          pythActionProvider(),
          walletActionProvider(),
          basenameActionProvider(),
          erc20ActionProvider(),
          wethActionProvider(),
          alchemyTokenPricesActionProvider(),
          morphoActionProvider()
        ],
      });
  
      const tools = getVercelAITools(agentKit);
      return { tools };
    } catch (error) {
      console.error("Failed to initialize agent:", error);
      throw error;
    }
  }
# Max Yield

A DeFi yield optimization platform that automatically allocates funds across multiple protocols to maximize returns while managing risk.

## Overview

Max Yield is a smart DeFi allocation platform that helps users optimize their yield farming strategy across multiple protocols on Base and perform multiple actions across multiple protocols. The platform analyzes various metrics including APY, liquidity, and utilization rates to determine the optimal allocation of funds.

## Features

### 🐝 AI Agents Swarm
- Multiple AI agents interacting between each other
- Market scanner agent (aggregates market data)
- Risk analyzer agent (generates risk scores for market data)
- Operator agent (performs deposit actions)
- All agents work as a swarm to generate the best overall APY

### 🎯 Smart Allocation
- Automated fund distribution across multiple protocols
- Real-time APY tracking and optimization
- Risk-adjusted returns calculation
- Dynamic rebalancing suggestions

### 💼 Portfolio Management
- Real-time portfolio overview
- Detailed protocol-specific metrics
- Historical performance tracking
- Wallet holdings summary

### 🔒 Supported Protocols
- Moonwell
  - Lending/Borrowing protocol
  - Real-time market data
  - Automated supply positions
- Morpho
  - Optimized lending protocol
  - Peer-to-peer matching
  - Enhanced yields through aggregation
- And many others...

## Technical Architecture

### Frontend
- Next.js 13 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Server-Side Rendering
- Vercel AI SDK for AI interactions

### Backend
- Next.js API Routes
- Stream-based real-time updates
- Protocol-specific SDKs integration
- Vercel AI SDK for AI interactions

### Blockchain Integration
- Viem for Ethereum interactions
- Base (Coinbase L2) as primary network
- Coinbase AgentKit for a seamless onchain UX

### Key Libraries
- @moonwell-fi/moonwell-sdk
- @morpho/sdk
- Coinbase's AgentKit
- next-auth for authentication
- vercel ai sdk

## Smart Allocation Algorithm

The allocation strategy considers multiple factors:
1. APY Weighting (50%)
   - Current yield rates
   - Historical yield stability
2. Risk Assessment (30%)
   - Protocol security
   - Smart contract audits
   - Historical performance
3. Market Conditions (20%)
   - Utilization rates
   - Available liquidity
   - Market depth


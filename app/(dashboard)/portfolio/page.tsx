import { AppSidebar } from "@/components/app-sidebar"
import { auth } from "@/app/(auth)/auth"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import { formatUSDC } from "@/lib/format"
import type { User } from "next-auth"

function PortfolioContent({ user }: { user: User | undefined }) {
  // Hardcoded data based on the logs
  const vaultPositions = [
    {
      protocol: "Moonwell",
      apy: "11.70%",
      tvl: "$7.29M",
      liquidity: "$7.29M",
      utilization: "87.5%",
      image: "/images/moonwell.png"
    },
    {
      protocol: "Morpho",
      apy: "5.55%",
      tvl: "$13.16M",
      liquidity: "$13.16M",
      utilization: "237.5%",
      image: "/images/morpho.png"
    }
  ]

  return (
    <div className="flex h-full w-full">
      <AppSidebar user={user} />
      <main className="flex-1 flex min-h-screen">
        <div className="w-full max-w-7xl px-6 mx-8 mt-8">
          <h1 className="text-2xl font-bold mb-6">Portfolio Overview</h1>
          
          {/* Wallet Holdings */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Wallet Holdings</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">USDC Balance</h3>
                <p className="font-mono text-lg">$6.00</p>
              </Card>
              <Card className="p-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">ETH Balance</h3>
                <p className="font-mono text-lg">0.0020 ETH</p>
              </Card>
            </div>
          </div>

          {/* Vault Positions */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Vault Positions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vaultPositions.map((vault) => (
                <Card key={vault.protocol} className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative w-8 h-8">
                      <Image
                        src={vault.protocol === "Moonwell" ? "/images/moonwell.png" : "/images/morpho.png"}
                        alt={vault.protocol}
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>
                    <h3 className="text-lg font-semibold">{vault.protocol}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">APY</p>
                      <p className="font-medium text-green-500">{vault.apy}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">TVL</p>
                      <p className="font-medium">{vault.tvl}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Liquidity</p>
                      <p className="font-medium">{vault.liquidity}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Utilization</p>
                      <p className="font-medium">{vault.utilization}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default async function PortfolioPage() {
  const session = await auth()
  return <PortfolioContent user={session?.user} />
} 
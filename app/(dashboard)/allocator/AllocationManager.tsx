"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Copy } from "lucide-react";
import type { AllocationResult, Allocation } from "@/lib/ai/allocator/allocator";

function formatUSDC(amount: number | null): string {
  if (amount === null || isNaN(amount)) return "0.00";
  return (amount / 1e6).toFixed(2);
}

function formatETH(amount: number | null): string {
  if (amount === null || isNaN(amount)) return "0.0000";
  return amount.toFixed(4);
}

function truncateAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

interface MarketDetails {
  symbol: string;
  address: string;
}

interface AllocationWithDetails extends Omit<AllocationResult, 'allocations'> {
  allocations: (Allocation & {
    marketDetails: MarketDetails;
  })[];
}

export function AllocationManager() {
  const [amount, setAmount] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [allocation, setAllocation] = useState<AllocationWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});
  const [walletInfo, setWalletInfo] = useState<{
    address: string;
    usdcBalance: number;
    ethBalance: number;
  } | null>(null);

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMap((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedMap((prev) => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const fetchWalletInfo = useCallback(async () => {
    try {
      const response = await fetch("/api/wallet/info");
      if (response.ok) {
        const data = await response.json();
        setWalletInfo(data);
      }
    } catch (error) {
      console.error("Failed to fetch wallet info:", error);
    }
  }, []);

  useEffect(() => {
    // Fetch wallet info initially
    fetchWalletInfo();

    // Set up periodic refresh every 30 seconds
    const intervalId = setInterval(fetchWalletInfo, 30000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [fetchWalletInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isLoading) return;

    setIsLoading(true);
    setLogs([]);
    setAllocation(null);

    try {
      const response = await fetch("/api/allocator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });

      if (!response.ok) throw new Error("Failed to start allocation");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n").filter(Boolean);

        lines.forEach((line) => {
          try {
            if (line.includes('"type":"result"')) {
              const { allocation } = JSON.parse(line);
              setAllocation(allocation);
            } else {
              setLogs((prev) => [...prev, line]);
            }
          } catch {
            setLogs((prev) => [...prev, line]);
          }
        });
      }

      // Refresh wallet info after successful transaction
      await fetchWalletInfo();
    } catch (error) {
      console.error("Error:", error);
      setLogs((prev) => [...prev, "Error: Failed to complete allocation"]);
    } finally {
      setIsLoading(false);
    }
  };

  const maxAmount = walletInfo?.usdcBalance ? formatUSDC(walletInfo.usdcBalance) : "0.00";

  return (
    <div className="space-y-6">
      {/* Wallet Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Wallet Address</h3>
          <button
            onClick={() => walletInfo?.address && copyToClipboard(walletInfo.address, "wallet")}
            className="font-mono text-sm flex items-center gap-2 hover:text-primary transition-colors"
            title="Click to copy address"
          >
            <span>{walletInfo ? truncateAddress(walletInfo.address) : "..."}</span>
            {copiedMap["wallet"] ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">USDC Balance</h3>
          <p className="font-mono text-sm">
            ${walletInfo ? formatUSDC(walletInfo.usdcBalance) : "0.00"}
          </p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">ETH Balance</h3>
          <p className="font-mono text-sm">
            {walletInfo ? formatETH(walletInfo.ethBalance) : "0.0000"} ETH
          </p>
        </Card>
      </div>

      {/* Input Form */}
      <Card className="p-6 w-full">
        <h2 className="text-lg font-semibold mb-4 text-center">USDC Allocation Manager</h2>
        <form onSubmit={handleSubmit} className="flex gap-2 justify-center">
          <div className="relative flex-1 max-w-xs">
            <Input
              type="number"
              step="0.01"
              min="0"
              max={maxAmount}
              placeholder="Enter amount in USDC"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-8"
            />
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          </div>
          <Button
            type="submit"
            disabled={!amount || isLoading || parseFloat(amount) > parseFloat(maxAmount)}
          >
            {isLoading ? "Analyzing..." : "Analyze & Deposit"}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground mt-2">Available: ${maxAmount} USDC</p>
      </Card>

      {/* Progress Logs */}
      {logs.length > 0 && (
        <Card className="p-4 bg-muted w-full">
          <h3 className="font-semibold mb-2">Progress</h3>
          <div className="font-mono text-sm space-y-2 break-words">
            {logs.map((log, index) => (
              <div key={index} className="whitespace-pre-wrap break-all">
                {log}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Allocation Results */}
      {allocation && (
        <div className="w-full">
          <h3 className="text-lg font-semibold mb-3 text-center">Allocation Summary</h3>
          <div className="grid gap-4">
            {allocation.allocations.map((item, index) => (
              <Card key={index} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium capitalize">{item.protocol}</p>
                    <button
                      onClick={() =>
                        copyToClipboard(item.marketDetails.address, `market-${index}`)
                      }
                      className="text-sm text-muted-foreground flex items-center gap-2 hover:text-primary transition-colors"
                      title="Click to copy address"
                    >
                      <span className="font-mono truncate max-w-[200px]">
                        {truncateAddress(item.marketDetails.address)}
                      </span>
                      {copiedMap[`market-${index}`] ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.marketDetails.symbol}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${formatUSDC(item.amount)}</p>
                    <p className="text-sm text-muted-foreground">APY: {item.apy}</p>
                  </div>
                </div>
              </Card>
            ))}
            <Card className="p-4 bg-muted">
              <div className="flex justify-between">
                <p className="font-semibold">Total Allocated</p>
                <p className="font-semibold">${formatUSDC(allocation.total)}</p>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
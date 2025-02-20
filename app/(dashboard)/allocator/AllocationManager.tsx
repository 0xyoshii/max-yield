"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AllocationResult } from "@/lib/ai/allocator/allocator";

function formatAmount(amount: number | null): string {
  if (amount === null || isNaN(amount)) return "0.000000";
  return amount.toFixed(6);
}

export function AllocationManager() {
  const [amount, setAmount] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [allocation, setAllocation] = useState<AllocationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

        // Convert the chunk to text and split into lines
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n").filter(Boolean);

        // Process each line
        lines.forEach(line => {
          try {
            // Check if it's the final allocation result
            if (line.includes('"type":"result"')) {
              const { allocation } = JSON.parse(line);
              setAllocation(allocation);
            } else {
              // Add as a log line
              setLogs(prev => [...prev, line]);
            }
          } catch {
            // If not JSON, treat as regular log
            setLogs(prev => [...prev, line]);
          }
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setLogs(prev => [...prev, "Error: Failed to complete allocation"]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Enter Amount to Allocate</h2>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="number"
            step="0.000001"
            placeholder="Enter amount in ETH"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="max-w-xs"
          />
          <Button type="submit" disabled={!amount || isLoading}>
            {isLoading ? "Analyzing..." : "Analyze"}
          </Button>
        </form>
      </div>

      {/* Progress Logs */}
      {logs.length > 0 && (
        <Card className="p-4 bg-muted">
          <h3 className="font-semibold mb-2">Analysis Progress</h3>
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
        <div>
          <h3 className="text-lg font-semibold mb-3">Optimal Allocation</h3>
          <div className="grid gap-4">
            {allocation.allocations.map((item, index) => (
              <Card key={index} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium capitalize">{item.protocol}</p>
                    <p className="text-sm text-muted-foreground truncate max-w-[200px]" title={item.vault}>
                      {item.vault}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatAmount(item.amount)} ETH</p>
                    <p className="text-sm text-muted-foreground">APY: {item.apy}</p>
                  </div>
                </div>
              </Card>
            ))}
            <Card className="p-4 bg-muted">
              <div className="flex justify-between">
                <p className="font-semibold">Total Allocated</p>
                <p className="font-semibold">{formatAmount(allocation.total)} ETH</p>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
} 
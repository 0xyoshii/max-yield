export function formatUSDC(amount: number): string {
  return (amount / 1e6).toFixed(2);
} 
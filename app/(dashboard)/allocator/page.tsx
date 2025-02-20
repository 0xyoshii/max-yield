import { Card } from "@/components/ui/card";
import { AppSidebar } from "@/components/app-sidebar";
import { AllocationManager } from "./AllocationManager";
import { auth } from "@/app/(auth)/auth";

export default async function AllocatorPage() {
  const session = await auth();

  return (
    <div className="flex h-full">
      <AppSidebar user={session?.user} />
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-6">Fund Allocation Manager</h1>
        <Card className="p-6">
          <AllocationManager />
        </Card>
      </div>
    </div>
  );
} 
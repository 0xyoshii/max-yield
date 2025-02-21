import { Card } from "@/components/ui/card";
import { AppSidebar } from "@/components/app-sidebar";
import { AllocationManager } from "./AllocationManager";
import { auth } from "@/app/(auth)/auth";

export default async function AllocatorPage() {
  const session = await auth();

  return (
    <div className="flex h-full w-full">
      <AppSidebar user={session?.user} />
      <main className="flex-1 flex min-h-screen items-center justify-center">
        <div className="w-full max-w-7xl px-24 mx-24 mt-8">
          <h1 className="text-2xl font-bold mb-6 text-center">Fund Allocation Manager</h1>
          <Card className="p-6">
            <AllocationManager />
          </Card>
        </div>
      </main>
    </div>
  );
} 
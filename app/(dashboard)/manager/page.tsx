import { AppSidebar } from "@/components/app-sidebar"
import { auth } from "@/app/(auth)/auth"
import type { User } from "next-auth"

function ManagerContent({ user }: { user: User | undefined }) {
  return (
    <div className="flex h-full">
      <AppSidebar user={user} />
      <div className="flex-1 flex">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">Manager Dashboard</h1>
            <p className="text-xl text-muted-foreground">Coming Soon</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function ManagerPage() {
  const session = await auth()

  return <ManagerContent user={session?.user} />
} 
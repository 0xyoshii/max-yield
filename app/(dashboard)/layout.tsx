'use client'

import { SidebarProvider } from "@/components/ui/sidebar"
import { SidebarToggle } from "@/components/sidebar-toggle"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen">
        <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2 z-10">
          <SidebarToggle />
        </header>
        <div className="flex-1 flex">
          {children}
        </div>
      </div>
    </SidebarProvider>
  )
} 
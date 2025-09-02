"use client"

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "@/components/user-menu";

export function DashboardHeader() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-3 md:hidden">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="h-7 w-7" />
      </div>
      
      <UserMenu />
    </header>
  );
}

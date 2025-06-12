"use client"

import type * as React from "react"
import {
  BarChart2,
  Receipt,
  Building2,
  Folder,
  Wallet,
  FileText,
  Banknote,
  GitMerge,
  TrendingDown,
  Database,
  Home,
  LogOut,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { hasPermission, useAuthStore } from "@/stores/authStore"
import { ThemeToggle } from "./ThemeToggle"
import { cn } from "@/lib/utils"

interface NavItemProps {
  href: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  requiresPermission?: boolean
}

function NavItem({ href, icon: Icon, children, requiresPermission = true }: NavItemProps) {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const isActive = pathname === href

  // If permission is required and user doesn't have it, don't render
  if (requiresPermission && user && !hasPermission(user.role, href)) {
    return null
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link
          href={href}
          className={cn(
            "flex items-center px-3 py-2.5 text-sm rounded-lg transition-all duration-200",
            isActive
              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-r-2 border-emerald-500 shadow-lg shadow-emerald-500/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
          )}
        >
          <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
          <span>{children}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const { logout } = useAuthStore()

  function handleLogout() {
    logout()
    router.push("/login")
  }

  return (
    <Sidebar variant="inset" {...props} className="border-r border-border">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground">Siclo</span>
            <span className="text-xs font-medium text-muted-foreground">Cuentas por pagar</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Dashboard standalone */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavItem href="/dashboard" icon={Home}>
                Dashboard
              </NavItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Gestión */}
        <SidebarGroup>
          <SidebarGroupLabel>Gestión</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavItem href="/documents" icon={FileText}>
                Documentos
              </NavItem>
              <NavItem href="/suppliers" icon={Building2}>
                Proveedores
              </NavItem>
              <NavItem href="/suppliers" icon={Building2}>
                Validación Sunat
              </NavItem>
              {/* <NavItem href="/retentions" icon={Receipt}>
                Retenciones
              </NavItem>
              <NavItem href="/detractions" icon={TrendingDown}>
                Detracciones
              </NavItem> */}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Finanzas */}
        <SidebarGroup>
          <SidebarGroupLabel>Finanzas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavItem href="/bank-accounts" icon={Wallet}>
                Cuentas Bancarias
              </NavItem>
              <NavItem href="/transactions" icon={Banknote}>
                Movimientos
              </NavItem>
              <NavItem href="/conciliations" icon={GitMerge}>
                Conciliación
              </NavItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Reportes */}
        <SidebarGroup>
          <SidebarGroupLabel>Reportes</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavItem href="/reports" icon={BarChart2}>
                Reportes
              </NavItem>
              <NavItem href="/reports/concar" icon={Database}>
                CONCAR
              </NavItem>
              <NavItem href="#" icon={Folder} requiresPermission={false}>
                Analytics
              </NavItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="space-y-2">
          <ThemeToggle />
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Cerrar sesión
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

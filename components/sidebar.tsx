"use client"

import * as React from "react"
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
  Shield,
  BookText,
  List,
  Activity,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Sun,
  Moon,
  Palette,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { hasPermission, useAuthStore } from "@/stores/authStore"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useRouter } from "next/navigation"

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
      <SidebarMenuButton asChild isActive={isActive} tooltip={String(children)}>
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

// Componente para mostrar información del usuario en el sidebar
function SidebarUserInfo() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useTheme()

  const handleLogout = () => {
    logout()
    router.push("/login")
    setOpen(false)
  }

  if (!user) return null

  const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || user.lastName || "Usuario"
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="w-full h-auto p-3 gap-3 hover:bg-muted/50 justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {userInitial}
          </div>
          <div className="flex flex-col items-start text-left min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-medium text-foreground truncate w-full">
              {userName}
            </span>
            <span className="text-xs text-muted-foreground truncate w-full">
              {user.email}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 ml-auto group-data-[collapsible=icon]:hidden" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-lg font-semibold">
              {userInitial}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-foreground truncate">
                {userName}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {user.email}
              </span>
              <span className="text-xs text-muted-foreground/70 capitalize">
                {user.role}
              </span>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="p-2">
          <div className="flex items-center justify-between p-2 rounded-md bg-muted/30">
            <span className="text-sm font-medium">Tema</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 w-7 p-0",
                  theme === "light" && "bg-background border border-border"
                )}
                onClick={() => setTheme("light")}
              >
                <Sun className="h-3.5 w-3.5 text-amber-500" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 w-7 p-0",
                  theme === "dark" && "bg-background border border-border"
                )}
                onClick={() => setTheme("dark")}
              >
                <Moon className="h-3.5 w-3.5 text-indigo-400" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 w-7 p-0",
                  theme === "system" && "bg-background border border-border"
                )}
                onClick={() => setTheme("system")}
              >
                <Palette className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar sesión</span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar 
      collapsible="icon" 
      variant="inset" 
      {...props} 
      className="border-0 bg-sidebar sidebar-content"
      style={{
        backgroundColor: 'hsl(var(--sidebar-background))',
        backgroundImage: 'none',
        backdropFilter: 'none'
      }}
    >
      <SidebarHeader 
        className="bg-sidebar"
        style={{
          backgroundColor: 'hsl(var(--sidebar-background))',
          backgroundImage: 'none',
          backdropFilter: 'none'
        }}
      >
        <div className="flex items-center gap-3 px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="text-lg font-bold text-foreground truncate">Siclo</span>
            <span className="text-xs font-medium text-muted-foreground truncate">Cuentas por pagar</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent 
        className="bg-sidebar"
        style={{
          backgroundColor: 'hsl(var(--sidebar-background))',
          backgroundImage: 'none',
          backdropFilter: 'none'
        }}
      >
        {/* Dashboard standalone removed */}

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
              <NavItem href="/sunat" icon={Shield}>
                Validación Sunat
              </NavItem>
      
              <NavItem href="/detractions" icon={TrendingDown}>
                Detracciones
              </NavItem>
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
              <NavItem href="/accounting" icon={BookText}>
                Contabilidad
              </NavItem>
              <NavItem href="/accounting-templates" icon={List}>
                Plantillas Asiento Contable
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
              <NavItem href="/reports/audit-logs" icon={Activity}>
                Audit Logs
              </NavItem>
              <NavItem href="#" icon={Folder} requiresPermission={false}>
                Analytics
              </NavItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter 
        className="bg-sidebar"
        style={{
          backgroundColor: 'hsl(var(--sidebar-background))',
          backgroundImage: 'none',
          backdropFilter: 'none'
        }}
      >
        {/* Información del usuario y controles */}
        <div className="space-y-2 p-2">
          {/* Sidebar Trigger para desktop */}
          <div className="hidden md:block">
            <SidebarTrigger className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2 h-9" />
          </div>
          
          {/* Separador */}
          <Separator className="my-2" />
          
          {/* Información del usuario */}
          <SidebarUserInfo />
        </div>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  )
}

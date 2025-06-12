"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import Image from "next/image"
import { Bell, ChevronRight, Building2, LogOut } from "lucide-react"
import Profile01 from "./profile-01"
import Link from "next/link"
import { useAuthStore } from "@/stores/authStore"
import { ThemeToggle } from "../ThemeToggle"

interface BreadcrumbItem {
  label: string
  href?: string
}

export default function TopNav() {
  const { user, logout, getCurrentCompany } = useAuthStore()
  const currentCompany = getCurrentCompany()

  const breadcrumbs: BreadcrumbItem[] = [
    { label: currentCompany?.name || "SICLO S.A.C.", href: "#" },
    { label: "Sistema Financiero", href: "#" },
  ]

  const handleLogout = () => {
    logout()
    window.location.href = "/login"
  }

  return (
    <nav className="px-3 sm:px-6 flex items-center justify-between backdrop-blur-sm border-b border-border h-full w-full bg-card/80">
      <div className="font-medium text-sm hidden sm:flex items-center space-x-1 truncate max-w-[300px] min-w-0">
        {breadcrumbs.map((item, index) => (
          <div key={item.label} className="flex items-center min-w-0">
            {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-1 flex-shrink-0" />}
            {item.href ? (
              <Link
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 truncate"
              >
                {index === 0 && <Building2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />}
                <span className="truncate">{item.label}</span>
              </Link>
            ) : (
              <span className="text-foreground truncate">{item.label}</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 sm:gap-4 ml-auto sm:ml-0 flex-shrink-0">
        {/* Company Info Display */}
        {currentCompany && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg">
            <Building2 className="h-4 w-4 text-emerald-500" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{currentCompany.tradeName || currentCompany.name}</span>
              <span className="text-xs text-muted-foreground">RUC: {currentCompany.ruc}</span>
            </div>
          </div>
        )}

        <button type="button" className="p-1.5 sm:p-2 rounded-full transition-colors relative hover:bg-muted">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full text-xs text-white flex items-center justify-center shadow-lg">
            3
          </span>
        </button>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <Image
              src={user?.image || "/diverse-user-avatars.png"}
              alt="User avatar"
              width={28}
              height={28}
              className="rounded-full ring-2 ring-border hover:ring-emerald-500 transition-all sm:w-8 sm:h-8 cursor-pointer flex-shrink-0"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-[280px] sm:w-80 rounded-lg shadow-xl bg-card border-border"
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium leading-none">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                <p className="text-xs leading-none text-emerald-600 font-medium capitalize">{user?.role}</p>
                {currentCompany && (
                  <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border">
                    <Building2 className="h-3 w-3 text-emerald-500" />
                    <span className="text-xs text-muted-foreground">{currentCompany.name}</span>
                  </div>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Profile01
              name={`${user?.firstName || ""} ${user?.lastName || ""}`}
              role={user?.role || "Usuario"}
              avatar={user?.image || "/diverse-user-avatars.png"}
            />
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}

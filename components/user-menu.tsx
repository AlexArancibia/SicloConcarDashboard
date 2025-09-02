"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  User, 
  LogOut, 
  Settings, 
  ChevronDown,
  Sun,
  Moon,
  Palette
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { useAuthStore } from "@/stores/authStore"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"

export function UserMenu() {
  const [open, setOpen] = useState(false)
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
          className="h-8 w-auto px-2 gap-2 hover:bg-muted/50"
        >
          <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
            {userInitial}
          </div>
          <div className="flex flex-col items-start text-left">
            <span className="text-xs font-medium text-foreground truncate max-w-[100px]">
              {userName}
            </span>
            <span className="text-xs text-muted-foreground truncate max-w-[100px]">
              {user.email}
            </span>
          </div>
          <ChevronDown className="h-3 w-3 text-muted-foreground transition-transform duration-200" />
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

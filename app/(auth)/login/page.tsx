"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Eye,
  EyeOff,
  Loader2,
  Crown,
  Shield,
  Edit3,
  Calculator,
  Lock,
  FileText,
  BarChart3,
  PieChart,
  DollarSign,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Mail,
} from "lucide-react"
import { useAuthStore } from "@/stores/authStore"

const testUsers = [
  {
    email: "admin@siclo.com",
    password: "admin123",
    role: "Admin",
    icon: Crown,
    color: "bg-gradient-to-r from-amber-400 to-amber-500",
  },
  {
    email: "conciliador@siclo.com",
    password: "conc123",
    role: "Conciliador",
    icon: Shield,
    color: "bg-gradient-to-r from-blue-400 to-blue-500",
  },
  {
    email: "editor@siclo.com",
    password: "edit123",
    role: "Editor",
    icon: Edit3,
    color: "bg-gradient-to-r from-emerald-400 to-emerald-500",
  },
]

export default function LoginPage() {
  const router = useRouter()
  const { login, loading, error, clearError, isAuthenticated, user } = useAuthStore()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [selectedUser, setSelectedUser] = useState<number | null>(null)

  // Redirect if already authenticated - optimizado para ser más rápido
  useEffect(() => {
    if (isAuthenticated) {
      // Redirección inmediata sin delay
      router.replace("/documents") // Redirigir a documentos después del login
    }
  }, [isAuthenticated, router])

  // Clear error when component mounts or form changes
  useEffect(() => {
    if (clearError) {
      clearError()
    }
  }, [formData, clearError])

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        if (clearError) {
          clearError()
        }
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  // Load saved email if remember me was checked
  useEffect(() => {
    const savedEmail = localStorage.getItem("savedEmail")
    const rememberMeStatus = localStorage.getItem("rememberMe")

    if (savedEmail && rememberMeStatus === "true") {
      setFormData((prev) => ({ ...prev, email: savedEmail }))
      setRememberMe(true)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      return
    }

    const success = await login(formData.email, formData.password)

    if (success) {
      // Save remember me preference
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true")
        localStorage.setItem("savedEmail", formData.email)
      } else {
        localStorage.removeItem("rememberMe")
        localStorage.removeItem("savedEmail")
      }

      // La redirección se maneja automáticamente por el useEffect
      // No necesitamos router.push aquí
    }
  }

  const handleUserSelect = (userIndex: number) => {
    const testUser = testUsers[userIndex]
    setFormData({
      email: testUser.email,
      password: testUser.password,
    })
    setSelectedUser(userIndex)

    setTimeout(() => setSelectedUser(null), 1000)
  }

  // Si ya está autenticado, mostrar loading mientras redirige
  if (isAuthenticated) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-600">
        <div className="text-center text-white">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Redirigiendo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex">
      {/* Left Panel - Login Form */}
      <div className="w-full lg:w-1/2 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl mb-4 shadow-lg shadow-emerald-500/25">
              <Calculator className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">
              Bienvenido a Siclo
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Gestiona tus finanzas de manera inteligente</p>
          </div>

          {/* Quick Access Users */}
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 text-center">Acceso rápido</p>
            <div className="grid grid-cols-3 gap-3">
              {testUsers.map((testUser, index) => {
                const IconComponent = testUser.icon
                return (
                  <button
                    key={index}
                    onClick={() => handleUserSelect(index)}
                    disabled={loading}
                    className={`group relative p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                      selectedUser === index
                        ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 shadow-lg shadow-emerald-500/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-700 bg-white dark:bg-gray-800 hover:shadow-md"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 ${testUser.color} rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm`}
                    >
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 block">{testUser.role}</span>
                    {selectedUser === index && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-gray-50 dark:bg-gray-900 px-3 text-gray-500 dark:text-gray-400">
                o continúa con email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Correo Electrónico
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="tu@email.com"
                  required
                  className="h-12 pl-11 pr-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl transition-all duration-200"
                  disabled={loading}
                />
                {selectedUser !== null && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                  className="h-12 pl-11 pr-12 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl transition-all duration-200"
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-12 px-4 hover:bg-transparent text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                {selectedUser !== null && (
                  <div className="absolute right-12 top-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                )}
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  disabled={loading}
                />
                <Label htmlFor="remember" className="text-sm text-gray-600 dark:text-gray-400">
                  Recordarme
                </Label>
              </div>
              <Link href="/forgot-password" className="text-sm text-emerald-600 hover:text-emerald-500">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {error && (
              <Alert
                variant="destructive"
                className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 rounded-xl"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-700 dark:text-red-300 text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 group"
              disabled={loading || !formData.email || !formData.password}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  Iniciar sesión
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          {/* Features */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>Gestión de documentos electrónicos</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>Conciliación bancaria automática</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>Reportes financieros en tiempo real</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ¿Problemas para acceder?{" "}
              <button className="text-emerald-600 hover:text-emerald-500 font-medium">Contacta soporte</button>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              © 2024 Sistema Financiero. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Refined Illustration */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 items-center justify-center relative overflow-hidden">
        {/* Main Content */}
        <div className="relative z-10 text-center max-w-lg">
          {/* Dashboard Mockup */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
            {/* Window Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
              <div className="text-xs text-white/70 font-medium">Dashboard Siclo</div>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Card 1 - Ingresos */}
              <div className="bg-white/15 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-xs text-white/80 font-medium">Ingresos</div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-white/40 rounded-full"></div>
                  <div className="h-1.5 bg-white/25 rounded-full w-3/4"></div>
                </div>
              </div>

              {/* Card 2 - Documentos */}
              <div className="bg-white/15 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-xs text-white/80 font-medium">Documentos</div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-white/40 rounded-full w-4/5"></div>
                  <div className="h-1.5 bg-white/25 rounded-full w-1/2"></div>
                </div>
              </div>

              {/* Card 3 - Análisis */}
              <div className="bg-white/15 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-xs text-white/80 font-medium">Análisis</div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-white/40 rounded-full w-5/6"></div>
                  <div className="h-1.5 bg-white/25 rounded-full w-2/3"></div>
                </div>
              </div>

              {/* Card 4 - Reportes */}
              <div className="bg-white/15 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <PieChart className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-xs text-white/80 font-medium">Reportes</div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-white/40 rounded-full"></div>
                  <div className="h-1.5 bg-white/25 rounded-full w-3/5"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="text-white mt-8">
            <h2 className="text-4xl font-bold mb-4 leading-tight">
              Control total de tus
              <br />
              <span className="text-emerald-200">finanzas empresariales</span>
            </h2>
            <p className="text-emerald-100 text-lg leading-relaxed opacity-90">
              Dashboard intuitivo que centraliza toda la gestión de cuentas por pagar
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

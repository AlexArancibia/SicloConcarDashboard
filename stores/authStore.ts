import { create } from "zustand"
import { jwtDecode, type JwtPayload } from "jwt-decode"
import apiClient from "../lib/axiosConfig"

interface ExtendedJwtPayload extends JwtPayload {
  exp?: number
  userId?: string
  role?: string
}

interface UserInfo {
  id: string
  email: string
  emailVerified: string | null
  image: string | null
  firstName: string
  lastName: string
  role: string
  authProvider: string
  authProviderId: string | null
  accessToken: string | null
  refreshToken: string | null
  tokenExpiresAt: string | null
  phone?: string
  bio: string | null
  preferences: any | null
  lastLogin: string | null
  failedLoginAttempts: number
  lockedUntil: string | null
  isActive: boolean
  companyId: string | null
  createdAt: string
  updatedAt: string
}

interface Company {
  id: string
  name: string
  tradeName?: string | null
  ruc: string
  address?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  logo?: string | null
  settings?: any | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface LoginResponse {
  access_token: string
  userInfo: UserInfo
  company: Company
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  companyId?: string
}

interface AuthState {
  user: UserInfo | null
  company: Company | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null

  // Auth methods
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  register: (userData: RegisterData) => Promise<boolean>
  resetPassword: (email: string) => Promise<boolean>
  updateProfile: (userData: Partial<UserInfo>) => Promise<boolean>
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>

  // Company management
  getCurrentCompany: () => Company | null
  updateCompany: (companyData: Partial<Company>) => Promise<boolean>

  // Utility methods
  initializeAuth: () => Promise<void>
  refreshToken: () => Promise<boolean>
  clearError: () => void

  // Token management
  getToken: () => string | null
  isTokenValid: () => boolean
}

// Permission system based on user roles
export const hasPermission = (role: string, path: string): boolean => {
  const permissions: Record<string, string[]> = {
    SUPERADMIN: [
      "/dashboard",
      "/documents",
      "/suppliers",
      "/retentions",
      "/detractions",
      "/bank-accounts",
      "/transactions",
      "/accounting",
      "/accounting-templates",
      "/conciliations",
      "/reports",
      "/sunat",
      "/reports/concar",
      "/admin",
      "/settings",
    ],
    ADMIN: [
      "/dashboard",
      "/documents",
      "/suppliers",
      "/retentions",
      "/sunat",
      "/accounting-templates",
      "/accounting",
      "/detractions",
      "/bank-accounts",
      "/transactions",
      "/conciliations",
      "/reports",
      "/reports/concar",
    ],
    MANAGER: [
      "/dashboard",
      "/documents",
      "/suppliers",
      "/retentions",
      "/accounting-templates",
      "/detractions",
      "/bank-accounts",
      "/transactions",
      "/conciliations",
      "/reports",
    ],
    EDITOR: [
      "/dashboard",
      "/documents",
      "/suppliers",
      "/sunat",
      "/retentions",
      "/detractions",
      "/bank-accounts",
      "/transactions",
      "/conciliations",
    ],
    VIEWER: ["/dashboard", "/documents", "/suppliers", "/reports"],
  }

  const userPermissions = permissions[role] || []
  return userPermissions.includes(path)
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  company: null,
  isAuthenticated: false,
  loading: true,
  error: null,

  initializeAuth: async () => {
    if (typeof window === "undefined") {
      set({ loading: false })
      return
    }

    const token = localStorage.getItem("access_token")
    const userString = localStorage.getItem("user")
    const companyString = localStorage.getItem("company")

    // Helper function to safely parse JSON
    const safeJsonParse = <T>(jsonString: string | null, fallback: T): T => {
      if (!jsonString || jsonString === "undefined" || jsonString === "null") {
        return fallback
      }
      try {
        return JSON.parse(jsonString) as T
      } catch (error) {
        console.warn("Error parsing JSON from localStorage:", String(error))
        return fallback
      }
    }

    if (token && userString && userString !== "undefined") {
      try {
        const decoded = jwtDecode<ExtendedJwtPayload>(token)
        const currentTime = Date.now() / 1000

        if (decoded.exp && decoded.exp > currentTime) {
          const user = safeJsonParse<UserInfo | null>(userString, null)
          const company = safeJsonParse<Company | null>(companyString, null)

          // Validate that user was parsed correctly
          if (!user || !user.id) {
            console.warn("Invalid user data in localStorage")
            get().logout()
            return
          }

          // Set axios default authorization header
          apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`

          set({
            user,
            company,
            isAuthenticated: true,
            loading: false,
          })
        } else {
          // Token expired
          get().logout()
        }
      } catch (error) {
        console.error("Error al decodificar el token:", error)
        get().logout()
      }
    } else {
      set({ loading: false })
    }
  },

  login: async (email: string, password: string) => {
    set({ loading: true, error: null })

    try {
      const response = await apiClient.post<LoginResponse>("/auth/login", {
        email,
        password,
      })

      const { access_token, userInfo, company } = response.data

      // Validate response data
      if (!access_token || !userInfo || !userInfo.id) {
        throw new Error("Invalid response from server")
      }

      // Store in localStorage with error handling
      try {
        localStorage.setItem("access_token", access_token)
        localStorage.setItem("user", JSON.stringify(userInfo))
        
        if (company && company.id) {
          localStorage.setItem("company", JSON.stringify(company))
        }
      } catch (storageError: any) {
        console.error("Error storing data in localStorage:", storageError)
        // Continue with login even if localStorage fails
      }

      // Set axios default authorization header
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${access_token}`

      set({
        user: userInfo,
        company: company || null,
        isAuthenticated: true,
        loading: false,
      })

      return true
    } catch (error: any) {
      console.error("Error durante el login:", error)
      set({
        loading: false,
        error: error.response?.data?.message || "Credenciales inválidas",
      })
      return false
    }
  },

  getCurrentCompany: () => {
    return get().company
  },

  updateCompany: async (companyData: Partial<Company>) => {
    set({ loading: true, error: null })

    try {
      const response = await apiClient.put<{ company: Company }>("/company/profile", companyData)
      const { company } = response.data

      // Update localStorage
      localStorage.setItem("company", JSON.stringify(company))

      set({
        company,
        loading: false,
      })

      return true
    } catch (error: any) {
      console.error("Error al actualizar empresa:", error)
      set({
        loading: false,
        error: error.response?.data?.message || "Error al actualizar empresa",
      })
      return false
    }
  },

  register: async (userData: RegisterData) => {
    set({ loading: true, error: null })

    try {
      const response = await apiClient.post<LoginResponse>("/auth/register", userData)
      const { access_token, userInfo, company } = response.data

      // Store in localStorage
      localStorage.setItem("access_token", access_token)
      localStorage.setItem("user", JSON.stringify(userInfo))
      
      if (company && company.id) {
        localStorage.setItem("company", JSON.stringify(company))
      }

      // Set axios default authorization header
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${access_token}`

      set({
        user: userInfo,
        company: company || null,
        isAuthenticated: true,
        loading: false,
      })

      return true
    } catch (error: any) {
      console.error("Error durante el registro:", error)
      set({
        loading: false,
        error: error.response?.data?.message || "Error durante el registro",
      })
      return false
    }
  },

  resetPassword: async (email: string) => {
    set({ loading: true, error: null })

    try {
      await apiClient.post("/auth/reset-password", { email })
      set({ loading: false })
      return true
    } catch (error: any) {
      console.error("Error al enviar email de recuperación:", error)
      set({
        loading: false,
        error: error.response?.data?.message || "Error al enviar email de recuperación",
      })
      return false
    }
  },

  updateProfile: async (userData: Partial<UserInfo>) => {
    set({ loading: true, error: null })

    try {
      const response = await apiClient.put<{ userInfo: UserInfo }>("/auth/profile", userData)
      const { userInfo } = response.data

      // Update localStorage
      localStorage.setItem("user", JSON.stringify(userInfo))

      set({
        user: userInfo,
        loading: false,
      })

      return true
    } catch (error: any) {
      console.error("Error al actualizar perfil:", error)
      set({
        loading: false,
        error: error.response?.data?.message || "Error al actualizar perfil",
      })
      return false
    }
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    set({ loading: true, error: null })

    try {
      await apiClient.put("/auth/change-password", {
        currentPassword,
        newPassword,
      })

      set({ loading: false })
      return true
    } catch (error: any) {
      console.error("Error al cambiar contraseña:", error)
      set({
        loading: false,
        error: error.response?.data?.message || "Error al cambiar contraseña",
      })
      return false
    }
  },

  refreshToken: async () => {
    try {
      const response = await apiClient.post<{ access_token: string }>("/auth/refresh")
      const { access_token } = response.data

      localStorage.setItem("access_token", access_token)
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${access_token}`

      return true
    } catch (error) {
      console.error("Error al refrescar token:", error)
      get().logout()
      return false
    }
  },

  logout: () => {
    try {
      // Clear localStorage
      localStorage.removeItem("access_token")
      localStorage.removeItem("user")
      localStorage.removeItem("company")
    } catch (error) {
      console.warn("Error clearing localStorage:", error)
      // If localStorage is corrupted, try to clear it completely
      try {
        localStorage.clear()
      } catch (clearError) {
        console.error("Could not clear localStorage:", clearError)
      }
    }

    // Clear axios authorization header
    delete apiClient.defaults.headers.common["Authorization"]

    set({
      user: null,
      company: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    })
  },

  clearError: () => {
    set({ error: null })
  },

  getToken: () => {
    if (typeof window === "undefined") return null
    return localStorage.getItem("access_token")
  },

  isTokenValid: () => {
    const token = get().getToken()
    if (!token) return false

    try {
      const decoded = jwtDecode<ExtendedJwtPayload>(token)
      const currentTime = Date.now() / 1000
      return decoded.exp ? decoded.exp > currentTime : false
    } catch {
      return false
    }
  },
}))

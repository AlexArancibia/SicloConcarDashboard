// Tipos de autenticación basados en el schema de Prisma
// Roles exactamente como en schema.prisma
export type UserRole = "ADMIN" | "MANAGER" | "ACCOUNTANT" | "EDITOR" | "VIEWER"
// Proveedores exactamente como en schema.prisma
export type AuthProvider = "GITHUB" | "GOOGLE" | "MICROSOFT" | "EMAIL"

export interface User {
  id: string
  email: string
  emailVerified: Date | null
  image: string | null
  firstName: string | null
  lastName: string | null
  role: UserRole

  // Campos para autenticación con proveedores externos
  authProvider: AuthProvider
  authProviderId: string | null
  accessToken: string | null
  refreshToken: string | null
  tokenExpiresAt: Date | null

  // Campos adicionales
  phone: string | null
  bio: string | null
  preferences: any | null
  lastLogin: Date | null
  failedLoginAttempts: number
  lockedUntil: Date | null
  isActive: boolean

  // Relaciones con empresas
  companyId: string | null
  company?: Company | null

  // Timestamps
  createdAt: Date
  updatedAt: Date
}

export interface Session {
  id: string
  sessionToken: string
  userId: string
  expires: Date
  user?: User
  createdAt: Date
  updatedAt: Date
}

export interface Company {
  id: string
  name: string // Razón social
  tradeName: string | null // Nombre comercial
  ruc: string // RUC de la empresa
  address: string | null // Dirección fiscal
  phone: string | null // Teléfono principal
  email: string | null // Email corporativo
  website: string | null // Sitio web
  logo: string | null // URL del logo

  // Configuraciones
  settings: any | null // Configuraciones específicas de la empresa
  isActive: boolean

  // Timestamps
  createdAt: Date
  updatedAt: Date
}

export interface AuthState {
  user: User | null
  company: Company | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  companyId?: string
}

export interface LoginResponse {
  access_token: string
  userInfo: User
  company: Company
}

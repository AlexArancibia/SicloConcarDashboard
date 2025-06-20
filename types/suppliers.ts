import type { BaseEntity } from "./common"
import type { Company } from "./auth"

// Tipos de proveedores basados en el schema de Prisma
export type SupplierType = "INDIVIDUAL" | "COMPANY" | "GOVERNMENT" | "FOREIGN"
export type SupplierStatus = "ACTIVE" | "INACTIVE" | "BLOCKED" | "PENDING_APPROVAL"
export type BankAccountType = "CHECKING" | "SAVINGS" | "CREDIT" | "INVESTMENT"


export const SupplierTypeLabels: Record<SupplierType, string> = {
  INDIVIDUAL: "Persona Natural",
  COMPANY: "Persona Jurídica",
  GOVERNMENT: "Entidad Gubernamental",
  FOREIGN: "Extranjero",
}

export const SupplierStatusLabels: Record<SupplierStatus, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  BLOCKED: "Bloqueado",
  PENDING_APPROVAL: "Pendiente",
}

export interface Supplier extends BaseEntity {
  companyId: string
  company?: Company

  // Información básica
  businessName: string
  tradeName: string | null
  documentType: string
  documentNumber: string
  supplierType: SupplierType

  // Información de contacto
  email: string | null
  phone: string | null
  address: string | null
  district: string | null
  province: string | null
  department: string | null
  country: string | null

  // Estado y configuración
  status: SupplierStatus
  creditLimit: number | null // Decimal en schema
  paymentTerms: number | null

  // Información tributaria
  taxCategory: string | null
  isRetentionAgent: boolean
  retentionRate: number | null // Decimal en schema

  // Relaciones
  supplierBankAccounts?: SupplierBankAccount[]

  // Campos adicionales del schema
  documents?: any[] // Relación con documentos
  transactions?: any[] // Relación con transacciones
  expenses?: any[] // Relación con gastos
  _count?: {
    documents: number
    transactions: number
    expenses: number
  }
}

export interface SupplierBankAccount extends BaseEntity {
  supplierId: string
  bankId: string
  accountNumber: string
  accountType: BankAccountType
  currency: string
  isDefault: boolean
  isActive: boolean

  // Relaciones expandidas
  bank?: {
    name: string
    code: string
  }
  currencyRef?: {
    code: string
    name: string
    symbol: string
  }
}

// DTO para crear supplier bank account
export interface CreateSupplierBankAccountDto {
  bankId: string
  accountNumber: string
  accountType: BankAccountType
  currency: string
  isDefault?: boolean
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface PaginationDto {
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateSupplierDto {
  companyId: string
  businessName: string
  tradeName?: string | null
  documentType: string
  documentNumber: string
  supplierType: SupplierType
  email?: string | null
  phone?: string | null
  address?: string | null
  district?: string | null
  province?: string | null
  department?: string | null
  country?: string | null
  status?: SupplierStatus
  creditLimit?: number | null
  paymentTerms?: number | null
  taxCategory?: string | null
  isRetentionAgent?: boolean
  retentionRate?: number | null
  supplierBankAccounts?: CreateSupplierBankAccountDto[]
}

export interface UpdateSupplierDto {
  businessName?: string
  tradeName?: string | null
  documentType?: string
  documentNumber?: string
  supplierType?: SupplierType
  email?: string | null
  phone?: string | null
  address?: string | null
  district?: string | null
  province?: string | null
  department?: string | null
  country?: string | null
  status?: SupplierStatus
  creditLimit?: number | null
  paymentTerms?: number | null
  taxCategory?: string | null
  isRetentionAgent?: boolean
  retentionRate?: number | null
  supplierBankAccounts?: CreateSupplierBankAccountDto[]
}

export interface SupplierStats {
  total: number
  byStatus: Record<SupplierStatus, number>
}

export interface UpdateSupplierStatusDto {
  status: SupplierStatus
}

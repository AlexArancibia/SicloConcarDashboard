import type { BaseEntity } from "./common"
import type { Company } from "./auth"

// Tipos basados en el schema de Prisma
export type BankAccountType = "CHECKING" | "SAVINGS" | "CREDIT" | "INVESTMENT"

export interface Bank extends BaseEntity {
  name: string
  code: string
  country: string | null
  isActive: boolean

  // Relaciones
  bankAccounts?: BankAccount[]
  supplierBankAccounts?: any[]
}

export interface BankAccount extends BaseEntity {
  companyId: string
  bankId: string
  accountNumber: string
  accountType: BankAccountType
  currency: string
  alias: string | null
  description: string | null
  isActive: boolean
  initialBalance: number // Decimal en schema
  currentBalance: number // Decimal en schema

  // Relaciones expandidas
  company?: Company
  bank?: Bank
  currencyRef?: {
    code: string
    name: string
    symbol: string
  }
  transactions?: any[]
  conciliations?: any[]
  expenses?: any[]
  _count?: {
    transactions: number
    conciliations: number
    expenses: number
  }
}

// ============================================================================
// DTOs para Bank Accounts
// ============================================================================

export interface CreateBankAccountDto {
  companyId: string
  bankId: string
  accountNumber: string
  accountType: BankAccountType
  currency: string
  alias?: string | null
  description?: string | null
  isActive?: boolean
  initialBalance?: number
}

export interface UpdateBankAccountDto {
  bankId?: string
  accountNumber?: string
  accountType?: BankAccountType
  currency?: string
  alias?: string | null
  description?: string | null
  isActive?: boolean
  initialBalance?: number
  currentBalance?: number
}

// ============================================================================
// DTOs para Banks (solo los necesarios para fetch)
// ============================================================================

export interface CreateBankDto {
  name: string
  code: string
  country?: string | null
  isActive?: boolean
}

export interface UpdateBankDto {
  name?: string
  code?: string
  country?: string | null
  isActive?: boolean
}

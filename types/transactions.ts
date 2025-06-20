import type { BaseEntity } from "./common"
import type { Company } from "./auth"

// Actualizar los enums para que coincidan con el schema de Prisma
export type TransactionType =
  | "DEBIT"
  | "CREDIT"
  | "TRANSFER"
  | "FEE"
  | "INTEREST"
  | "DETRACTION"
  | "ITF"
  | "PAYMENT"
  | "DEPOSIT"
  | "WITHDRAWAL"
export type TransactionStatus = "PENDING" | "PROCESSED" | "RECONCILED" | "CANCELLED"

// ============================================================================
// INTERFACES PRINCIPALES
// ============================================================================

// En la interface Transaction, actualizar los campos opcionales
export interface Transaction extends BaseEntity {
  companyId: string
  bankAccountId: string
  transactionDate: Date
  valueDate: Date | null
  description: string
  transactionType: TransactionType
  amount: string // Decimal en schema
  balance: string // Decimal en schema
  branch: string | null
  operationNumber: string | null
  operationTime: string | null
  operatorUser: string | null
  utc: string | null
  reference: string | null
  channel: string | null
  fileName: string | null
  importedAt: Date | null
  status: TransactionStatus
  conciliatedAmount: string | null // Ahora es opcional en el schema
  pendingAmount: string | null // Ahora es opcional en el schema
  transactionHash: string

  // Relaciones expandidas se mantienen igual
  company?: Company
  bankAccount?: {
    id: string
    accountNumber: string
    alias: string | null
    bank: {
      name: string
      code: string
    }
    currencyRef: {
      code: string
      name: string
      symbol: string
    }
  }
  supplier?: {
    id: string
    businessName: string
    documentNumber: string
  } | null
  conciliations?: Array<{
    id: string
    reference: string | null
    status: string
    totalAmount: string | null
    createdAt: Date
  }>
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface PaginationDto {
  page?: number
  limit?: number
}

export interface TransactionPaginatedResponse {
  data: Transaction[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// En CreateTransactionDto, actualizar campos opcionales
export interface CreateTransactionDto {
  companyId: string
  bankAccountId: string
  transactionDate: Date | string
  valueDate?: Date | string | null
  description: string
  transactionType: TransactionType
  amount: number
  balance: number
  branch?: string | null
  operationNumber?: string | null
  operationTime?: string | null
  operatorUser?: string | null
  utc?: string | null
  reference?: string | null
  channel?: string | null
  fileName?: string | null
  importedAt?: Date | string | null
  status?: TransactionStatus
  conciliatedAmount?: number | null // Ahora opcional
  pendingAmount?: number | null // Ahora opcional
}

// En UpdateTransactionDto, actualizar campos opcionales
export interface UpdateTransactionDto {
  transactionDate?: Date | string
  valueDate?: Date | string | null
  description?: string
  transactionType?: TransactionType
  amount?: number
  balance?: number
  branch?: string | null
  operationNumber?: string | null
  operationTime?: string | null
  operatorUser?: string | null
  utc?: string | null
  reference?: string | null
  channel?: string | null
  fileName?: string | null
  importedAt?: Date | string | null
  status?: TransactionStatus
  conciliatedAmount?: number | null // Ahora opcional
  pendingAmount?: number | null // Ahora opcional
}

export interface ImportTransactionsDto {
  companyId: string
  bankAccountId: string
  file: File
}

export interface ImportTransactionsResult {
  imported: number
  duplicates: number
  errors: string[]
}

export interface TransactionStats {
  total: number
  byStatus: Record<string, { count: number; amount: number }>
}

export interface UpdateTransactionStatusDto {
  status: TransactionStatus
}

import type { BaseEntity } from "./common"
import type { Company } from "./auth"

// Enums basados en el schema de Prisma
export type ExpenseStatus = "IMPORTED" | "PROCESSED" | "RECONCILED" | "REJECTED" | "CANCELLED"

// ============================================================================
// INTERFACES PRINCIPALES
// ============================================================================

export interface Expense extends BaseEntity {
  companyId: string
  bankAccountId: string
  supplierId: string | null
  documentId: string | null
  transactionDate: Date
  valueDate: Date | null
  description: string
  amount: string // Decimal en schema
  currency: string
  exchangeRate: string // Decimal en schema
  localAmount: string // Decimal en schema
  documentNumber: string | null
  documentDate: Date | null
  issueDate: Date | null
  dueDate: Date | null
  category: string | null
  subcategory: string | null
  paymentMethod: string | null
  reference: string | null
  notes: string | null
  tags: string | null
  isRecurring: boolean
  recurringFrequency: string | null
  isTaxDeductible: boolean
  taxAmount: string | null // Decimal en schema
  status: ExpenseStatus
  rowHash: string | null
  fileName: string | null
  rowNumber: number | null
  importedAt: Date | null
  importedById: string | null
  processedAt: Date | null
  processedById: string | null
  reconciledAt: Date | null
  reconciledById: string | null

  // Relaciones expandidas
  company?: Company
  bankAccount?: {
    id: string
    accountNumber: string
    alias: string | null
    bank: {
      name: string
      code: string
    }
  }
  supplier?: {
    id: string
    businessName: string
    documentNumber: string
    documentType: string
  } | null
  document?: {
    id: string
    fullNumber: string
    documentType: string
    total: string
    issueDate: Date
  } | null
  importedBy?: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
  } | null
  processedBy?: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
  } | null
  reconciledBy?: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
  } | null
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface PaginationDto {
  page?: number
  limit?: number
}

export interface ExpensePaginatedResponse {
  data: Expense[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateExpenseDto {
  companyId: string
  bankAccountId: string
  supplierId?: string | null
  documentId?: string | null
  transactionDate: Date | string
  valueDate?: Date | string | null
  description: string
  amount: number
  currency: string
  exchangeRate?: number
  localAmount?: number
  documentNumber?: string | null
  documentDate?: Date | string | null
  issueDate?: Date | string | null
  dueDate?: Date | string | null
  category?: string | null
  subcategory?: string | null
  paymentMethod?: string | null
  reference?: string | null
  notes?: string | null
  tags?: string | null
  isRecurring?: boolean
  recurringFrequency?: string | null
  isTaxDeductible?: boolean
  taxAmount?: number | null
  status?: ExpenseStatus
  rowHash?: string | null
  fileName?: string | null
  rowNumber?: number | null
  importedAt?: Date | string | null
  importedById?: string | null
  processedAt?: Date | string | null
  processedById?: string | null
  reconciledAt?: Date | string | null
  reconciledById?: string | null
}

export interface UpdateExpenseDto {
  bankAccountId?: string
  supplierId?: string | null
  documentId?: string | null
  transactionDate?: Date | string
  valueDate?: Date | string | null
  description?: string
  amount?: number
  currency?: string
  exchangeRate?: number
  localAmount?: number
  documentNumber?: string | null
  documentDate?: Date | string | null
  issueDate?: Date | string | null
  dueDate?: Date | string | null
  category?: string | null
  subcategory?: string | null
  paymentMethod?: string | null
  reference?: string | null
  notes?: string | null
  tags?: string | null
  isRecurring?: boolean
  recurringFrequency?: string | null
  isTaxDeductible?: boolean
  taxAmount?: number | null
  status?: ExpenseStatus
  rowHash?: string | null
  fileName?: string | null
  rowNumber?: number | null
  processedAt?: Date | string | null
  processedById?: string | null
  reconciledAt?: Date | string | null
  reconciledById?: string | null
}

export interface ReconcileExpenseDto {
  documentId: string
  reconciledById: string
}

export interface ExpenseFiltersDto extends PaginationDto {
  status?: ExpenseStatus
  bankAccountId?: string
  supplierId?: string
  category?: string
  subcategory?: string
  startDate?: string
  endDate?: string
  minAmount?: number
  maxAmount?: number
  currency?: string
  isTaxDeductible?: boolean
  isRecurring?: boolean
  search?: string
}

export interface ExpenseStats {
  total: number
  byStatus: Record<ExpenseStatus, number>
  byCategory: Record<string, number>
  totalAmount: number
  averageAmount: number
  taxDeductibleAmount: number
}

export interface ExpenseSummary {
  totalExpenses: number
  totalAmount: string
  byStatus: Array<{
    status: ExpenseStatus
    count: number
    amount: string
  }>
  byCategory: Array<{
    category: string
    count: number
    amount: string
  }>
  byCurrency: Array<{
    currency: string
    count: number
    amount: string
  }>
  monthlyTrend: Array<{
    month: string
    count: number
    amount: string
  }>
}

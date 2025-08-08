import type { BaseEntity, PaginationDto } from "./common"
import type { Company } from "./auth"

// Re-export PaginationDto for convenience
export type { PaginationDto }

// Enums basados en el schema de Prisma
export type ExpenseType = "OPERATIONAL" | "ADMINISTRATIVE" | "FINANCIAL" | "TAX" | "OTHER"
export type ExpenseStatus = "IMPORTED" | "PROCESSED" | "RECONCILED" | "REJECTED"

// ============================================================================
// INTERFACES PRINCIPALES (alineadas con prisma.schema)
// ============================================================================

export interface Expense extends BaseEntity {
  companyId: string
  lineNumber: number | null
  bankAccountId: string | null
  transactionDate: Date
  valueDate: Date | null
  operationDesc: string | null
  amount: string
  balance: string | null
  branch: string | null
  operationNumber: string | null
  operationTime: string | null
  user: string | null
  utc: string | null
  reference2: string | null
  documentType: string | null
  fiscalFolio: string | null
  concept: string | null
  totalAmount: string | null
  subtotal: string | null
  igv: string | null
  isr: string | null
  accountingMonth: string | null
  comments: string | null
  documentDate: Date | null
  issueDate: Date | null
  dueDate: Date | null
  isMassive: boolean
  expenseType: ExpenseType
  currency: string
  supplierId: string | null
  documentId: string | null
  expenseCategoryId: string | null
  status: ExpenseStatus
  originalFileName: string | null
  rowHash: string | null
  importedAt: Date | null
  importedById: string | null
  processedAt: Date | null
  processedById: string | null
  reconciledAt: Date | null
  reconciledById: string | null

  // Relaciones expandidas (opcionales)
  company?: Company
}

// ============================================================================
// DTOs (Data Transfer Objects) alineados con backend
// ============================================================================

export interface ExpensePaginatedResponse {
  data: Expense[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Basado en Nest DTO (src/expenses/dto/create-expense.dto.ts)
export interface CreateExpenseDto {
  companyId: string
  lineNumber: number
  bankAccountId: string
  transactionDate: string | Date
  valueDate?: string | Date
  operationDesc: string
  amount: number
  balance: number
  branch?: string
  operationNumber: string
  operationTime?: string
  user?: string
  utc?: string
  reference2?: string
  documentType?: string
  fiscalFolio?: string
  supplierName?: string
  concept?: string
  totalAmount?: number
  subtotal?: number
  igv?: number
  isr?: number
  discipline?: string
  location?: string
  generalCategory?: string
  type?: string
  account?: string
  subAccount?: string
  accountingMonth?: string
  accountingAccount?: string
  comments?: string
  supplierRuc?: string
  documentDate?: string | Date
  issueDate?: string | Date
  dueDate?: string | Date
  isMassive?: boolean
  expenseType: ExpenseType
  currency?: string
  supplierId?: string
  documentId?: string
  importBatchId?: string
  originalFileName?: string
  importedById: string
  status?: ExpenseStatus
  rowHash?: string
  importedAt?: string | Date
  processedAt?: string | Date
  processedById?: string
  reconciledAt?: string | Date
  reconciledById?: string
}

export interface UpdateExpenseDto {
  lineNumber?: number
  bankAccountId?: string | null
  transactionDate?: string | Date
  valueDate?: string | Date | null
  operationDesc?: string | null
  amount?: number
  balance?: number | null
  branch?: string | null
  operationNumber?: string | null
  operationTime?: string | null
  user?: string | null
  utc?: string | null
  reference2?: string | null
  documentType?: string | null
  fiscalFolio?: string | null
  concept?: string | null
  totalAmount?: number | null
  subtotal?: number | null
  igv?: number | null
  isr?: number | null
  accountingMonth?: string | null
  comments?: string | null
  documentDate?: string | Date | null
  issueDate?: string | Date | null
  dueDate?: string | Date | null
  isMassive?: boolean
  expenseType?: ExpenseType
  currency?: string
  supplierId?: string | null
  documentId?: string | null
  expenseCategoryId?: string | null
  status?: ExpenseStatus
  originalFileName?: string | null
  rowHash?: string | null
  importedAt?: string | Date | null
  importedById?: string | null
  processedAt?: string | Date | null
  processedById?: string | null
  reconciledAt?: string | Date | null
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
  startDate?: string
  endDate?: string
  minAmount?: number
  maxAmount?: number
  currency?: string
  search?: string
}

export interface ExpenseStats {
  total: number
  byStatus: Record<ExpenseStatus, number>
  totalAmount: number
}

export interface ExpenseSummary {
  totalExpenses: number
  totalAmount: string
  byStatus: Array<{
    status: ExpenseStatus
    count: number
    amount: string
  }>
  monthlyTrend: Array<{
    month: string
    count: number
    amount: string
  }>
}

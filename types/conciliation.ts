import type { BaseEntity } from "./common"
import type { Company } from "./auth"

// Enums basados en el schema de Prisma
export type ConciliationType = "DOCUMENTS" | "DETRACTIONS" 
export type ConciliationStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
export type ConciliationItemType = "DOCUMENT" | "TRANSACTION" | "ADJUSTMENT" | "FEE" | "OTHER"
export type ConciliationItemStatus = "PENDING" | "MATCHED" | "PARTIAL" | "REJECTED"
export type ExpenseType = "OPERATIONAL" | "ADMINISTRATIVE" | "FINANCIAL" | "TAX" | "OTHER"

// ============================================================================
// INTERFACES PRINCIPALES
// ============================================================================

export interface Conciliation extends BaseEntity {
  companyId: string
  bankAccountId: string
  transactionId: string | null
  type: ConciliationType
  reference: string | null
  periodStart: Date
  periodEnd: Date
  totalDocuments: number
  conciliatedItems: number
  pendingItems: number
  bankBalance: string // Decimal en schema
  bookBalance: string // Decimal en schema
  difference: string // Decimal en schema
  toleranceAmount: string // Decimal en schema
  status: ConciliationStatus
  additionalExpensesTotal: string // Decimal en schema
  totalAmount: string | null // Decimal en schema
  paymentDate: Date | null
  paymentAmount: string | null // Decimal en schema
  notes: string | null
  createdById: string
  approvedById: string | null
  completedAt: Date | null

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
  transaction?: {
    id: string
    description: string
    amount: string
    transactionDate: Date
  } | null
  createdBy?: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
  }
  approvedBy?: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
  } | null
  items?: ConciliationItem[]
  expenses?: ConciliationExpense[]
  _count?: {
    items: number
    expenses: number
  }
}

export interface ConciliationItem extends BaseEntity {
  conciliationId: string
  itemType: ConciliationItemType
  documentId: string | null
  documentAmount: string // Decimal en schema
  conciliatedAmount: string // Decimal en schema
  difference: string // Decimal en schema
  distributionPercentage: string // Decimal en schema
  detractionAmount: string // Decimal en schema
  retentionAmount: string // Decimal en schema
  status: ConciliationItemStatus
  notes: string | null
  systemNotes: string | null
  conciliatedBy: string | null

  // Relaciones expandidas
  conciliation?: {
    id: string
    reference: string | null
    status: ConciliationStatus
  }
  document?: {
    id: string
    fullNumber: string
    documentType: string
    issueDate: Date
    total: string
    supplier: {
      businessName: string
      documentNumber: string
    }
  } | null
}

export interface ConciliationExpense extends BaseEntity {
  conciliationId: string
  description: string
  amount: string // Decimal en schema
  expenseType: ExpenseType
  accountId: string | null
  notes: string | null
  isTaxDeductible: boolean
  supportingDocument: string | null
  expenseDate: Date

  // Relaciones expandidas
  conciliation?: {
    id: string
    reference: string | null
    status: ConciliationStatus
  }
  account?: {
    accountCode: string
    accountName: string
  } | null
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface PaginationDto {
  page?: number
  limit?: number
}

export interface ConciliationPaginatedResponse {
  data: Conciliation[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateConciliationExpenseDto {
  description: string
  amount: number
  expenseType: ExpenseType
  accountId?: string
  notes?: string
  isTaxDeductible?: boolean
  supportingDocument?: string
  expenseDate: string | Date
}

export interface CreateConciliationDto {
  companyId: string
  bankAccountId: string
  transactionId?: string
  type?: ConciliationType
  reference?: string
  periodStart: string | Date
  periodEnd: string | Date
  totalDocuments?: number
  conciliatedItems?: number
  pendingItems?: number
  bankBalance: number
  bookBalance: number
  difference: number
  toleranceAmount?: number
  status?: ConciliationStatus
  additionalExpensesTotal?: number
  totalAmount?: number
  paymentDate?: string | Date
  paymentAmount?: number
  notes?: string
  createdById: string
  approvedById?: string
  expenses?: CreateConciliationExpenseDto[]
}

export interface UpdateConciliationDto {
  reference?: string
  periodStart?: string | Date
  periodEnd?: string | Date
  totalDocuments?: number
  conciliatedItems?: number
  pendingItems?: number
  bankBalance?: number
  bookBalance?: number
  difference?: number
  toleranceAmount?: number
  status?: ConciliationStatus
  additionalExpensesTotal?: number
  totalAmount?: number
  paymentDate?: string | Date
  paymentAmount?: number
  notes?: string
  approvedById?: string
  completedAt?: string | Date
}

export interface CreateConciliationItemDto {
  conciliationId: string
  itemType: ConciliationItemType
  documentId?: string
  documentAmount: number
  conciliatedAmount: number
  difference: number
  distributionPercentage?: number
  detractionAmount?: number
  retentionAmount?: number
  status?: ConciliationItemStatus
  notes?: string
  systemNotes?: string
  conciliatedBy?: string
}

export interface UpdateConciliationItemDto {
  itemType?: ConciliationItemType
  documentId?: string
  documentAmount?: number
  conciliatedAmount?: number
  difference?: number
  distributionPercentage?: number
  detractionAmount?: number
  retentionAmount?: number
  status?: ConciliationItemStatus
  notes?: string
  systemNotes?: string
  conciliatedBy?: string
}

export interface UpdateConciliationExpenseDto {
  description?: string
  amount?: number
  expenseType?: ExpenseType
  accountId?: string
  notes?: string
  isTaxDeductible?: boolean
  supportingDocument?: string
  expenseDate?: string | Date
}

export interface ConciliationFiltersDto extends PaginationDto {
  type?: ConciliationType
  status?: ConciliationStatus
  bankAccountId?: string
  startDate?: string
  endDate?: string
  createdById?: string
  search?: string
}

export interface ValidateConciliationDto {
  transactionId: string
  documentIds: string[]
  tolerance?: number
}

export interface ConciliationValidationResult {
  transaction: {
    id: string
    amount: number
    description: string
    date: Date
  }
  documents: Array<{
    id: string
    fullNumber: string
    amount: number
    supplier: string
    issueDate: Date
  }>
  summary: {
    transactionAmount: number
    documentsTotal: number
    difference: number
    tolerance: number
    isWithinTolerance: boolean
    canConciliate: boolean
  }
}

export interface AutoConciliationResult {
  matchedDocuments: number
  totalAmount: number
  items: ConciliationItem[]
}

export interface ConciliationStatistics {
  total: number
  completed: number
  inProgress: number
  pending: number
  completionRate: number
  totalConciliatedAmount: number
}

export interface BulkOperationResult {
  id: string
  success: boolean
  data?: any
  error?: string
}

export interface ExportConciliationsResult {
  format: "csv" | "excel"
  data: Conciliation[]
  filename: string
  totalRecords: number
}

export interface PendingDocument {
  id: string
  fullNumber: string
  documentType: string
  issueDate: Date
  total: string
  supplier: {
    businessName: string
    documentNumber: string
  }
}

export interface UnmatchedTransaction {
  id: string
  description: string
  amount: string
  transactionDate: Date
  bankAccount: {
    accountNumber: string
    alias: string | null
    bank: {
      name: string
    }
  }
}

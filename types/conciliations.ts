import type { BaseEntity, PaginationDto } from "./common"
import type { Company } from "./auth"

// Enums basados en el schema de Prisma
export type ConciliationType = "DOCUMENTS" | "DETRACTIONS"
export type ConciliationStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
export type ConciliationItemType = "DOCUMENT" | "TRANSACTION" | "ADJUSTMENT" | "FEE" | "OTHER"
export type ConciliationItemStatus = "PENDING" | "MATCHED" | "PARTIAL" | "REJECTED" | "UNMATCHED"
export type ExpenseType = "OPERATIONAL" | "ADMINISTRATIVE" | "FINANCIAL" | "TAX" | "OTHER"

// ============================================================================
// INTERFACES DE INFORMACIÓN CONTABLE
// ============================================================================


export interface ConciliationQueryDto extends PaginationDto {
  status?: ConciliationStatus;
  type?: ConciliationType;
  dateFrom?: string;
  dateTo?: string;
  periodFrom?: string;
  periodTo?: string;
  search?: string;
  bankAccountId?: string;
  minDifference?: string;
  maxDifference?: string;
  minBankBalance?: string;
  maxBankBalance?: string;
  createdById?: string;
  approvedById?: string;
  hasTransaction?: boolean;
}



export interface AccountLink {
  id: string
  percentage: number
  amount: number
  account: {
    id: string
    accountCode: string
    accountName: string
    accountType: string
    level?: number
    description?: string
    parentAccount?: {
      id?: string
      accountCode: string
      accountName: string
      accountType?: string
    }
    childAccounts?: Array<{
      id: string
      accountCode: string
      accountName: string
    }>
  }
}

export interface CostCenterLink {
  id: string
  percentage: number
  amount: number
  costCenter: {
    id: string
    code: string
    name: string
    description?: string
    level?: number
    parentCostCenter?: {
      id?: string
      code: string
      name: string
    }
    childCostCenters?: Array<{
      id: string
      code: string
      name: string
    }>
  }
}

export interface DocumentLine {
  id: string
  lineNumber: number
  description: string
  quantity: number
  unitPrice: number
  lineTotal: number
  igvAmount?: number
  accountLinks: AccountLink[]
  costCenterLinks: CostCenterLink[]
  taxScheme?: {
    taxSchemeId: string
    taxSchemeName: string
    taxPercentage: number
  }
}

export interface AccountingSummary {
  uniqueAccounts: Array<{
    id: string
    accountCode: string
    accountName: string
    accountType: string
    level?: number
  }>
  uniqueCostCenters: Array<{
    id: string
    code: string
    name: string
    description?: string
    level?: number
  }>
  accountDistribution: Record<string, number>
  costCenterDistribution: Record<string, number>
}

export interface DetailedAccountingSummary {
  accountsInvolved: Array<{
    id: string
    accountCode: string
    accountName: string
    accountType: string
    level?: number
    totalAmount: number
    documentCount: number
    percentage: number
  }>
  costCentersInvolved: Array<{
    id: string
    code: string
    name: string
    description?: string
    level?: number
    totalAmount: number
    documentCount: number
    percentage: number
  }>
  accountDistribution: Record<
    string,
    {
      accountCode: string
      accountName: string
      accountType: string
      totalAmount: number
      documentCount: number
      items: Array<{
        documentId: string
        documentNumber: string
        amount: number
        percentage: number
      }>
    }
  >
  costCenterDistribution: Record<
    string,
    {
      code: string
      name: string
      description?: string
      totalAmount: number
      documentCount: number
      items: Array<{
        documentId: string
        documentNumber: string
        amount: number
        percentage: number
      }>
    }
  >
  documentLinesAnalysis: {
    totalLines: number
    linesWithAccounts: number
    linesWithCostCenters: number
    linesWithBoth: number
    averageAccountsPerLine: number
    averageCostCentersPerLine: number
  }
  accountHierarchies: Record<
    string,
    {
      parent: {
        accountCode: string
        accountName: string
      }
      children: Array<{
        accountCode: string
        accountName: string
        totalAmount: number
      }>
    }
  >
  costCenterHierarchies: Record<
    string,
    {
      parent: {
        code: string
        name: string
      }
      children: Array<{
        code: string
        name: string
        totalAmount: number
      }>
    }
  >
}

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
    accountType: string
    currency: string
    currentBalance: number
    bank: {
      id: string
      name: string
      code: string
      country: string
    }
    currencyRef: {
      code: string
      name: string
      symbol: string
    }
  }
  transaction?: {
    id: string
    description: string
    amount: string
    transactionDate: Date
    valueDate?: Date
    transactionType: string
    status: string
    operationNumber?: string
    reference?: string
    balance?: number
    operationTime?: string
    branch?: string
    channel?: string
  } | null
  createdBy?: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
    role: string
  }
  approvedBy?: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
    role: string
  } | null
  items?: ConciliationItem[]
  expenses?: ConciliationExpense[]
  documentDetractions?: Array<{
    id: string
    amount: number
    document: {
      id: string
      fullNumber: string
      documentType: string
      total: number
      supplier: {
        businessName: string
        documentNumber: string
      }
    }
  }>
  _count?: {
    items: number
    expenses: number
    documentDetractions: number
  }

  // Información de resumen mejorada
  summary?: {
    totalDocumentAmount: number
    totalConciliatedAmount: number
    totalExpensesAmount: number
    totalDetractionsAmount?: number
    netAmount: number
    varianceAmount: number
    completionPercentage: number
    pendingItemsCount: number
    matchedItemsCount: number
    hasMoreItems: boolean
    hasMoreExpenses: boolean
    itemsBreakdown: {
      total: number
      pending: number
      matched: number
      partial: number
      unmatched: number
    }
    expensesBreakdown: {
      total: number
      byType: Record<string, number>
      byAccount: Record<string, number>
    }
    suppliersInvolved: Array<{
      id: string
      businessName: string
      documentNumber: string
    }>
    accountingSummary?: AccountingSummary
    accountingDetails?: DetailedAccountingSummary
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
    toleranceAmount: number
    bankAccount?: {
      accountNumber: string
      bank: {
        name: string
      }
      currencyRef: {
        code: string
        name: string
        symbol: string
      }
    }
  }
  document?: {
    id: string
    fullNumber: string
    documentType: string
    issueDate: Date
    total: string
    currency: string
    supplier: {
      id: string
      businessName: string
      tradeName?: string
      documentType: string
      documentNumber: string
      supplierType: string
      status?: string
      email?: string
      phone?: string
      address?: string
      supplierBankAccounts?: Array<{
        bank: {
          name: string
        }
        currencyRef: {
          code: string
        }
      }>
    }
    currencyRef: {
      code: string
      name: string
      symbol: string
    }
    // Información contable del documento
    accountLinks: AccountLink[]
    costCenterLinks: CostCenterLink[]
    // Líneas del documento con información contable
    lines: DocumentLine[]
    detraction?: {
      id: string
      amount: number
      percentage: number
    }
    paymentTerms?: Array<{
      termNumber: number
      dueDate: Date
      amount: number
    }>
  } | null

  // Análisis específico del ítem
  analysis?: {
    variancePercentage: number
    isWithinTolerance: boolean
    recommendedAction: "APPROVED" | "REVIEW_AND_APPROVE" | "INVESTIGATE" | "REJECT_AND_INVESTIGATE"
    riskLevel: "LOW" | "MEDIUM" | "HIGH"
    accountingAnalysis: {
      documentAccountsCount: number
      documentCostCentersCount: number
      linesWithAccounts: number
      linesWithCostCenters: number
      accountDistribution: Record<string, { amount: number; percentage: number }>
      costCenterDistribution: Record<string, { amount: number; percentage: number }>
    }
  }
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
    totalAmount: number
    bankAccount: {
      bank: {
        name: string
      }
      currencyRef: {
        code: string
        name: string
        symbol: string
      }
    }
    createdBy?: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
  }
  account?: {
    id: string
    accountCode: string
    accountName: string
    accountType: string
    level?: number
    description?: string
    parentAccount?: {
      id: string
      accountCode: string
      accountName: string
      accountType: string
    }
    childAccounts?: Array<{
      id: string
      accountCode: string
      accountName: string
      accountType?: string
    }>
  } | null

  // Análisis del gasto
  analysis?: {
    percentageOfTotal: number
    taxImplications: {
      isDeductible: boolean
      requiresSupport: boolean
      taxSavings: number
    }
    accountHierarchy?: {
      current: {
        accountCode: string
        accountName: string
        accountType: string
      }
      parent?: {
        accountCode: string
        accountName: string
        accountType: string
      }
      children: Array<{
        id: string
        accountCode: string
        accountName: string
        accountType?: string
      }>
    }
  }
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

 
export interface ConciliationPaginatedResponse {
  data: Conciliation[]
  total: number
  page: number
  limit: number
  totalPages: number
  aggregations?: {
    totalAmount: number
    totalExpenses: number
    statusDistribution: Record<string, number>
    typeDistribution?: Record<string, number>
    bankAccountDistribution?: Record<string, number>
    globalAccountingSummary?: {
      allUniqueAccounts: Array<{
        id: string
        accountCode: string
        accountName: string
        accountType: string
      }>
      allUniqueCostCenters: Array<{
        id: string
        code: string
        name: string
      }>
      mostUsedAccounts: Array<{
        id: string
        accountCode: string
        accountName: string
        count: number
        totalAmount: number
      }>
      mostUsedCostCenters: Array<{
        id: string
        code: string
        name: string
        count: number
        totalAmount: number
      }>
    }
    accountingAggregations?: {
      totalUniqueAccounts: number
      totalUniqueCostCenters: number
      mostUsedAccounts: Array<{
        id: string
        accountCode: string
        accountName: string
        count: number
        totalAmount: number
      }>
      mostUsedCostCenters: Array<{
        id: string
        code: string
        name: string
        count: number
        totalAmount: number
      }>
    }
  }
}

export interface CreateConciliationExpenseDto {
  conciliationId?: string // Opcional si se crea junto con la conciliación
  description: string
  amount: number
  expenseType: ExpenseType
  accountId?: string
  notes?: string
  isTaxDeductible?: boolean
  supportingDocument?: string
  expenseDate: string | Date
}

export interface CreateConciliationItemDto {
  conciliationId?: string // Opcional si se crea junto con la conciliación
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
  // Gastos adicionales con información contable
  expenses?: CreateConciliationExpenseDto[]
  // Items de conciliación (documentos ya tienen sus cuentas y centros de costo)
  items?: CreateConciliationItemDto[]
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
    type: string
    bankAccount: {
      accountNumber: string
      bank: string
      currency: string
    }
  }
  documents: Array<{
    id: string
    fullNumber: string
    documentType: string
    amount: number
    currency: string
    supplier: {
      id?: string
      businessName?: string
      documentNumber?: string
      type?: string
    }
    issueDate: Date
    linesPreview: Array<{
      description: string
      amount: number
      accounts: Array<{
        code: string
        name: string
        percentage: number
        amount: number
      }>
      costCenters: Array<{
        code: string
        name: string
        percentage: number
        amount: number
      }>
    }>
    accountLinks: Array<{
      accountCode: string
      accountName: string
      accountType: string
      percentage: number
      amount: number
    }>
    costCenterLinks: Array<{
      code: string
      name: string
      percentage: number
      amount: number
    }>
  }>
  summary: {
    transactionAmount: number
    documentsTotal: number
    difference: number
    tolerance: number
    isWithinTolerance: boolean
    canConciliate: boolean
    currencyMismatch: boolean
    accountingSummary: {
      totalAccounts: number
      totalCostCenters: number
      accountsInvolved: Array<{
        id: string
        accountCode: string
        accountName: string
        accountType: string
      }>
      costCentersInvolved: Array<{
        id: string
        code: string
        name: string
      }>
    }
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
    id: string
    businessName: string
    tradeName?: string
    documentNumber: string
    supplierType: string
  }
  currencyRef: {
    code: string
    name: string
    symbol: string
  }
  accountLinks: Array<{
    account: {
      accountCode: string
      accountName: string
      accountType: string
    }
  }>
  costCenterLinks: Array<{
    costCenter: {
      code: string
      name: string
    }
  }>
  lines: Array<{
    description: string
    quantity: number
    unitPrice: number
    lineTotal: number
    accountLinks: Array<{
      account: {
        accountCode: string
        accountName: string
      }
    }>
    costCenterLinks: Array<{
      costCenter: {
        code: string
        name: string
      }
    }>
  }>
  detraction?: {
    id: string
    amount: number
    percentage: number
  }
}

export interface UnmatchedTransaction {
  id: string
  description: string
  amount: string
  transactionDate: Date
  transactionType: string
  status: string
  operationNumber?: string
  reference?: string
  balance?: number
  bankAccount: {
    accountNumber: string
    alias: string | null
    bank: {
      id: string
      name: string
      code: string
    }
    currencyRef: {
      code: string
      name: string
      symbol: string
    }
  }
}


export interface ConciliationStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  completionRate: number;
  totalConciliatedAmount: number;
}

export interface ExportConciliationResult {
  format: "csv" | "excel";
  data: Conciliation[];
  filename: string;
  totalRecords: number;
}

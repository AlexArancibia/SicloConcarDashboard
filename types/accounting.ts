import type { BaseEntity } from "./common"
import type { Company } from "./auth"
import { Conciliation } from "./conciliations"

// ============================================================================
// INTERFACES PRINCIPALES - ACCOUNTING ACCOUNTS
// ============================================================================

export interface AccountingAccount extends BaseEntity {
  companyId: string
  accountCode: string
  accountName: string
  accountType: string
  description: string | null
  parentAccountId: string | null
  level: number
  isActive: boolean
  // Campos no garantizados por el schema actual fueron retirados para alinear
  // allowsTransactions?: boolean
  // normalBalance?: string
  // taxRelevant?: boolean
  // reconciliationRequired?: boolean

  // Relaciones expandidas
  company?: Company
  parentAccount?: {
    id: string
    accountCode: string
    accountName: string
    level?: number
  } | null
  childAccounts?: Array<{
    id: string
    accountCode: string
    accountName: string
    level: number
  }>
  _count?: {
    childAccounts: number
    documentAccountLinks: number
    documentLineAccountLinks: number
    conciliationExpenses: number
  }
}

// ============================================================================
// INTERFACES PRINCIPALES - COST CENTERS
// ============================================================================

export interface CostCenter extends BaseEntity {
  companyId: string
  code: string
  name: string
  description: string | null
  parentCostCenterId: string | null
  level: number
  isActive: boolean
  // Campos no presentes actualmente en schema retirados
  // budgetAmount?: string | null
  // actualAmount?: string | null
  // manager?: string | null
  // department?: string | null

  // Relaciones expandidas
  company?: Company
  parentCostCenter?: {
    id: string
    code: string
    name: string
    level?: number
  } | null
  childCostCenters?: Array<{
    id: string
    code: string
    name: string
    level: number
  }>
  _count?: {
    childCostCenters: number
    documentCostCenterLinks: number
    documentLineCostCenterLinks: number
  }
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface PaginationDto {
  page?: number
  limit?: number
}

export interface AccountingAccountPaginatedResponse {
  data: AccountingAccount[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ==========================================================================
// ACCOUNTING ENTRIES TYPES (aligned to backend schema)
// ==========================================================================

export type MovementType = "DEBIT" | "CREDIT"

export interface AccountingEntryLine extends BaseEntity {
  entryId: string
  companyId: string
  lineNumber: number
  accountCode: string
  movementType: MovementType
  amount: number | string
  description: string | null
  auxiliaryCode: string | null
  documentRef: string | null
}

export interface AccountingEntry extends BaseEntity {
  companyId: string
  conciliationId: string
  conciliation: Conciliation
  status: string
  notes: string | null
  metadata?: any
  lines?: AccountingEntryLine[]
}

export interface CreateAccountingEntryLineDto {
  lineNumber?: number
  accountCode: string
  movementType: MovementType
  amount: number
  description?: string | null
  auxiliaryCode?: string | null
  documentRef?: string | null
  calculationBase?: CalculationBase | null
  value?: number | string | null
  applicationType?: ApplicationType
}

export interface CreateAccountingEntryDto {
  companyId: string
  conciliationId: string
  status?: string
  notes?: string | null
  metadata?: any
  lines: CreateAccountingEntryLineDto[]
}

export interface UpdateAccountingEntryDto {
  conciliationId?: string | null
  status?: string
  notes?: string | null
  metadata?: any
  lines?: CreateAccountingEntryLineDto[]
}

export interface AccountingEntryPaginatedResponse {
  data: AccountingEntry[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CostCenterPaginatedResponse {
  data: CostCenter[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ==========================================================================
// ACCOUNTING ENTRY TEMPLATES TYPES (aligned to backend schema)
// ==========================================================================

export type AccountingEntryFilter = "INVOICES" | "PAYROLL" | "BOTH"
export type AccountingEntryCurrency = "ALL" | "PEN" | "USD"
export type ApplicationType = "FIXED_AMOUNT" | "PERCENTAGE" | "TRANSACTION_AMOUNT"
export type CalculationBase = "SUBTOTAL" | "IGV" | "TOTAL" | "RENT" | "TAX" | "RETENTION_AMOUNT" | "DETRACTION_AMOUNT" | "NET_PAYABLE" | "PENDING_AMOUNT" | "CONCILIATED_AMOUNT" | "OTHER"

export interface AccountingEntryTemplateLine extends BaseEntity {
  templateId: string
  companyId: string
  accountCode: string
  movementType: MovementType
  applicationType: ApplicationType
  calculationBase?: CalculationBase | null
  value?: number | string | null
  executionOrder: number
}

export interface AccountingEntryTemplate extends BaseEntity {
  companyId: string
  templateNumber: string
  name: string
  filter: AccountingEntryFilter
  currency: AccountingEntryCurrency
  transactionType: string
  document?: string | null
  condition: any
  isActive: boolean
  description?: string | null
  lines: AccountingEntryTemplateLine[]
}

export interface CreateAccountingEntryTemplateLineDto {
  accountCode: string
  movementType: MovementType
  applicationType: ApplicationType
  calculationBase?: CalculationBase | null
  value?: number | null
  executionOrder?: number
}

export interface CreateAccountingEntryTemplateDto {
  templateNumber: string
  name: string
  filter: AccountingEntryFilter
  currency: AccountingEntryCurrency
  transactionType: string
  document?: string | null
  condition?: any
  description?: string | null
  isActive?: boolean
  lines: CreateAccountingEntryTemplateLineDto[]
}

export interface UpdateAccountingEntryTemplateDto {
  templateNumber?: string
  name?: string
  filter?: AccountingEntryFilter
  currency?: AccountingEntryCurrency
  transactionType?: string
  document?: string | null
  condition?: any
  description?: string | null
  isActive?: boolean
  lines?: CreateAccountingEntryTemplateLineDto[]
}

// DTOs para Accounting Accounts
export interface CreateAccountingAccountDto {
  companyId: string
  accountCode: string
  accountName: string
  accountType: string
  description?: string | null
  parentAccountId?: string | null
  isActive?: boolean
  // allowsTransactions?: boolean
  // normalBalance?: string
  // taxRelevant?: boolean
  // reconciliationRequired?: boolean
}

export interface UpdateAccountingAccountDto {
  accountCode?: string
  accountName?: string
  accountType?: string
  description?: string | null
  parentAccountId?: string | null
  isActive?: boolean
  allowsTransactions?: boolean
  normalBalance?: string
  taxRelevant?: boolean
  reconciliationRequired?: boolean
}

// DTOs para Cost Centers
export interface CreateCostCenterDto {
  companyId: string
  code: string
  name: string
  description?: string | null
  parentCostCenterId?: string | null
  isActive?: boolean
  // budgetAmount?: number | null
  // actualAmount?: number | null
  // manager?: string | null
  // department?: string | null
}

export interface UpdateCostCenterDto {
  code?: string
  name?: string
  description?: string | null
  parentCostCenterId?: string | null
  isActive?: boolean
  // budgetAmount?: number | null
  // actualAmount?: number | null
  // manager?: string | null
  // department?: string | null
}

// Interfaces para jerarquías
export interface AccountingAccountHierarchy extends AccountingAccount {
  childAccounts?: AccountingAccountHierarchy[]
}

export interface CostCenterHierarchy extends CostCenter {
  childCostCenters?: CostCenterHierarchy[]
}

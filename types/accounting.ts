import type { BaseEntity } from "./common"
import type { Company } from "./auth"

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
  allowsTransactions: boolean
  normalBalance: string // DEBIT or CREDIT
  taxRelevant: boolean
  reconciliationRequired: boolean

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
  budgetAmount: string | null // Decimal en schema
  actualAmount: string | null // Decimal en schema
  manager: string | null
  department: string | null

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

export interface CostCenterPaginatedResponse {
  data: CostCenter[]
  total: number
  page: number
  limit: number
  totalPages: number
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
  allowsTransactions?: boolean
  normalBalance: string // DEBIT or CREDIT
  taxRelevant?: boolean
  reconciliationRequired?: boolean
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
  budgetAmount?: number | null
  actualAmount?: number | null
  manager?: string | null
  department?: string | null
}

export interface UpdateCostCenterDto {
  code?: string
  name?: string
  description?: string | null
  parentCostCenterId?: string | null
  isActive?: boolean
  budgetAmount?: number | null
  actualAmount?: number | null
  manager?: string | null
  department?: string | null
}

// Interfaces para jerarquías
export interface AccountingAccountHierarchy extends AccountingAccount {
  childAccounts?: AccountingAccountHierarchy[]
}

export interface CostCenterHierarchy extends CostCenter {
  childCostCenters?: CostCenterHierarchy[]
}

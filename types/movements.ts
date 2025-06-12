import type { BaseEntity, Currency } from "./common"

export type MovementType = "credit" | "debit"
export type MovementCategory = "payment" | "collection" | "transfer" | "fee" | "interest" | "tax" | "other"

export interface Movement extends BaseEntity {
  accountNumber: string
  accountId: string
  date: string
  valueDate: string
  description: string
  amount: number
  balance: number
  type: MovementType
  category: MovementCategory
  branch: string
  branchCode?: string
  operationNumber: string
  operationTime: string
  user: string
  utc: string
  reference: string
  accountHolder: string
  currency: Currency
  accountType: string
  uploadDate: string
  fileName: string
  batchId?: string
  isReconciled: boolean
  reconciledAt?: string
  reconciledBy?: string
  reconciliationId?: string
}

export interface MovementBatch extends BaseEntity {
  fileName: string
  filePath: string
  accountNumber: string
  totalMovements: number
  totalCredits: number
  totalDebits: number
  uploadedAt: string
  uploadedBy: string
  processedAt?: string
  status: "uploaded" | "processing" | "processed" | "error"
  errorMessage?: string
}

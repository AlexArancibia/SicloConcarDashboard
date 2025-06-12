import type { BaseEntity, Currency } from "./common"

export type DetractionStatus = "pending" | "paid" | "overdue" | "cancelled"

export interface Detraction extends BaseEntity {
  id: string
  documentId: string
  documentType: string
  documentNumber: string
  supplier: string
  supplierId: string
  supplierRuc: string
  documentDate: string
  documentAmount: number
  detractionRate: number
  detractionAmount: number
  paymentDate: string | null
  operationNumber: string | null
  status: DetractionStatus
  accountNumber: string
  accountId: string
  currency: Currency
  dueDate: string
  observations?: string
  createdBy: string
  updatedBy?: string
}

export interface DetractionPayment extends BaseEntity {
  detractionId: string
  paymentDate: string
  operationNumber: string
  amount: number
  bankMovementId?: string
  observations?: string
  createdBy: string
}

export interface DetractionRate extends BaseEntity {
  code: string
  description: string
  rate: number
  isActive: boolean
  effectiveFrom: string
  effectiveTo?: string
}

export interface DetractionAccount extends BaseEntity {
  accountNumber: string
  bankCode: string
  bankName: string
  isActive: boolean
}

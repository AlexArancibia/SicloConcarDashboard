import type { BaseEntity, Currency } from "./common"

export type RetentionStatus = "draft" | "issued" | "sent" | "cancelled" | "voided"
export type RetentionType = "igv" | "renta" | "other"

export interface RetentionDocument extends BaseEntity {
  documentId: string
  amount: number
  retentionAmount: number
}

export interface Retention extends BaseEntity {
  retentionNumber: string
  date: string
  supplier: string
  supplierId: string
  supplierRuc: string
  retentionType: RetentionType
  retentionRate: number
  totalInvoiced: number
  retentionAmount: number
  netAmount: number
  status: RetentionStatus
  currency: Currency
  documents: RetentionDocument[]
  accountId: string
  dueDate: string
  observations?: string
  xmlPath?: string
  pdfPath?: string
  sentAt?: string
  sentBy?: string
  voidedAt?: string
  voidedBy?: string
  voidReason?: string
  createdBy: string
  updatedBy?: string
}

export interface RetentionRate extends BaseEntity {
  type: RetentionType
  code: string
  description: string
  rate: number
  isActive: boolean
  effectiveFrom: string
  effectiveTo?: string
}

export interface RetentionCertificate extends BaseEntity {
  retentionId: string
  certificateNumber: string
  issueDate: string
  period: string
  filePath: string
  createdBy: string
}

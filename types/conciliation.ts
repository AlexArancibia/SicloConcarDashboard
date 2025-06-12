import type { BaseEntity } from "./common"
import type { Company } from "./auth"
import type { BankAccount } from "./bank-accounts"
import type { User } from "./auth"
import type { Transaction } from "./transactions"
import type { Document } from "./documents"

// Tipos de conciliación basados en el schema de Prisma
export type ConciliationStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "REVIEWED" | "APPROVED"
export type ConciliationItemType = "DOCUMENT_TRANSACTION" | "TRANSACTION_ONLY" | "DOCUMENT_ONLY" | "ADJUSTMENT"
export type ConciliationItemStatus = "MATCHED" | "PARTIAL_MATCH" | "UNMATCHED" | "PENDING" | "DISPUTED" | "EXCLUDED"

export interface Conciliation extends BaseEntity {
  companyId: string
  company?: Company

  // Información de la conciliación
  bankAccountId: string
  bankAccount?: BankAccount

  // Relación directa con la transacción (1:1)
  transactionId: string
  transaction?: Transaction

  // Período de conciliación
  periodStart: string // Fecha inicio del período
  periodEnd: string // Fecha fin del período

  // Resumen de la conciliación
  totalDocuments: number // Total de documentos en el período
  conciliatedItems: number // Items conciliados
  pendingItems: number // Items pendientes

  // Saldos
  bankBalance: number // Saldo según banco
  bookBalance: number // Saldo según libros
  difference: number // Diferencia
  toleranceAmount: number // Monto de tolerancia para conciliación automática

  // Estado y proceso
  status: ConciliationStatus

  // Información de auditoría
  createdById: string
  createdBy?: User

  // Fecha de finalización
  completedAt?: string | null

  // Relaciones
  items?: ConciliationItem[]
}

export interface ConciliationItem extends BaseEntity {
  conciliationId: string
  conciliation?: Conciliation

  // Tipo de conciliación
  itemType: ConciliationItemType

  // Referencias a documento (la transacción está en la conciliación)
  documentId: string
  document?: Document

  // Información del item
  documentAmount: number // Monto del documento
  conciliatedAmount: number // Monto conciliado
  difference: number // Diferencia

  // Distribución porcentual (para conciliaciones parciales)
  distributionPercentage: number | null

  // Información de detracciones y retenciones aplicadas
  detractionAmount: number | null
  retentionAmount: number | null

  // Estado de conciliación
  status: ConciliationItemStatus

  // Observaciones y notas
  notes: string | null
  systemNotes: string | null // Notas generadas automáticamente

  // Información de auditoría
  conciliatedAt: string | null
  conciliatedBy: string | null
}

// DTOs para crear y actualizar conciliaciones
export interface CreateConciliationDto {
  companyId: string
  bankAccountId: string
  transactionId: string
  periodStart: string
  periodEnd: string
  bankBalance: number
  bookBalance: number
  difference: number
  toleranceAmount?: number
  status?: ConciliationStatus
  createdById: string
  totalDocuments?: number
  conciliatedItems?: number
  pendingItems?: number
}

export interface UpdateConciliationDto {
  periodStart?: string
  periodEnd?: string
  bankBalance?: number
  bookBalance?: number
  difference?: number
  toleranceAmount?: number
  status?: ConciliationStatus
  totalDocuments?: number
  conciliatedItems?: number
  pendingItems?: number
  completedAt?: string | null
}

// DTOs para crear y actualizar items de conciliación
export interface CreateConciliationItemDto {
  conciliationId: string
  itemType: ConciliationItemType
  documentId: string
  documentAmount: number
  conciliatedAmount: number
  difference?: number
  distributionPercentage?: number | null
  detractionAmount?: number | null
  retentionAmount?: number | null
  status?: ConciliationItemStatus
  notes: string | null
  systemNotes?: string | null
  conciliatedBy: string
}

export interface UpdateConciliationItemDto {
  documentAmount?: number
  conciliatedAmount?: number
  difference?: number
  distributionPercentage?: number | null
  detractionAmount?: number | null
  retentionAmount?: number | null
  status?: ConciliationItemStatus
  notes?: string | null
  systemNotes?: string | null
  conciliatedAt?: string | null
  conciliatedBy?: string | null
}

// Tipos para la interfaz de conciliación
export interface ReconciliationDocument extends Document {
  amountToReconcile: number
  reconciledAmount: number
  pendingAmount: number
}

export interface ConciliationSummary {
  totalTransactions: number
  totalDocuments: number
  conciliatedItems: number
  pendingItems: number
  bankBalance: number
  bookBalance: number
  difference: number
  withinTolerance: boolean
}

// Tipo para la respuesta de validación
export interface ValidateConciliationResponse {
  isValid: boolean
  transactionAmount: number
  totalDocuments: number
  difference: number
  withinTolerance: boolean
  errors: string[]
}

// Tipo para la respuesta de conciliación automática
export interface AutoConciliationResponse {
  matched: number
  partialMatches: number
  unmatched: number
}

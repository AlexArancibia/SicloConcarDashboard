import type { BaseEntity } from "./common"
import type { Company } from "./auth"
import type { Supplier } from "./suppliers"
import type { User } from "./auth"

// Tipos de documentos basados en el schema de Prisma
export type DocumentType =
  | "FACTURA"
  | "BOLETA"
  | "NOTA_CREDITO"
  | "NOTA_DEBITO"
  | "RECIBO_HONORARIOS"
  | "LIQUIDACION"
  | "OTROS"

export type DocumentStatus =
  | "PENDING"
  | "VALIDATED"
  | "REJECTED"
  | "CONCILIATED"
  | "PARTIALLY_CONCILIATED"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED"

export interface Document extends BaseEntity {
  companyId: string
  company?: Company

  documentType: DocumentType
  series: string
  number: string
  fullNumber: string // Serie-Número completo

  supplierId: string
  supplier?: Supplier

  issueDate: string
  dueDate: string | null
  receptionDate: string | null

  currency: string
  exchangeRate: number | null
  subtotal: number
  igv: number
  otherTaxes: number | null
  total: number

  // Información de retenciones y detracciones
  hasRetention: boolean
  retentionAmount: number | null
  retentionPercentage: number | null
  hasDetraction: boolean
  detractionAmount: number | null
  detractionCode: string | null
  detractionPercentage: number | null
  detractionServiceCode?: string | null

  // Montos para conciliación
  netPayableAmount: number // Monto neto a pagar (total - retenciones - detracciones)
  conciliatedAmount: number // Monto ya conciliado
  pendingAmount: number // Monto pendiente de conciliar

  description: string | null
  observations: string | null
  tags: string[]
  status: DocumentStatus

  // Información del XML
  xmlFileName: string | null
  xmlContent: string | null // Contenido completo del XML
  xmlHash: string | null // Hash del XML para detectar duplicados
  xmlUblVersion?: string | null
  xmlCustomizationId?: string | null
  documentTypeDescription?: string | null

  // Información SUNAT
  sunatResponseCode: string | null
  cdrStatus: string | null
  sunatProcessDate: string | null

  // Archivos relacionados
  pdfFile: string | null // Archivo PDF generado
  qrCode: string | null // Código QR del documento

  // Notas adicionales
  documentNotes?: string[]
  operationNotes?: string[]

  createdById: string
  updatedById: string | null
  createdBy?: User
  updatedBy?: User | null

  // Líneas de detalle del documento
  lines?: DocumentLine[]
}

export interface DocumentLine extends BaseEntity {
  documentId: string
  document?: Document

  lineNumber?: number
  productCode?: string | null
  description: string
  quantity: number
  unitCode: string
  unitPrice: number
  lineTotal: number

  // Información tributaria por línea
  igvAmount?: number | null
  taxExemptionCode?: string | null
  taxPercentage?: number | null
  taxCategoryId?: string | null
  taxSchemeId?: string | null
  taxSchemeName?: string | null
  freeOfChargeIndicator?: boolean | null
  taxableAmount?: number | null
  allowanceIndicator?: boolean
  chargeIndicator?: boolean
}
import type { BaseEntity } from "./common"
import type { Company } from "./auth"
import type { PaginationDto } from "./common"

// Enums basados en el schema de Prisma
export type DocumentType = "INVOICE" | "CREDIT_NOTE" | "DEBIT_NOTE" | "RECEIPT" | "PURCHASE_ORDER" | "CONTRACT"
export type DocumentStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "PAID" | "CANCELLED"

// ============================================================================
// INTERFACES PRINCIPALES
// ============================================================================

export interface Document extends BaseEntity {
  companyId: string
  documentType: DocumentType
  series: string
  number: string
  fullNumber: string
  supplierId: string
  issueDate: Date
  issueTime: string | null
  dueDate: Date | null
  receptionDate: Date | null
  currency: string
  exchangeRate: string // Decimal en schema
  subtotal: string // Decimal en schema
  igv: string // Decimal en schema
  otherTaxes: string // Decimal en schema
  total: string // Decimal en schema
  hasRetention: boolean
  retentionAmount: string // Decimal en schema
  retentionPercentage: string // Decimal en schema
  netPayableAmount: string // Decimal en schema
  conciliatedAmount: string // Decimal en schema
  pendingAmount: string // Decimal en schema
  paymentMethod: string | null
  description: string | null
  observations: string | null
  tags: string | null
  status: DocumentStatus
  orderReference: string | null
  contractNumber: string | null
  additionalNotes: string | null
  documentNotes: string | null
  operationNotes: string | null
  createdById: string
  updatedById: string

  // Relaciones expandidas
  company?: Company
  supplier?: {
    id: string
    businessName: string
    documentNumber: string
    documentType: string
  }
  currencyRef?: {
    code: string
    name: string
    symbol: string
  }
  createdBy?: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
  }
  updatedBy?: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
  }
  lines?: DocumentLine[]
  paymentTerms?: DocumentPaymentTerm[]
  accountLinks?: DocumentAccountLink[]
  costCenterLinks?: DocumentCostCenterLink[]
  xmlData?: DocumentXmlData | null
  digitalSignature?: DocumentDigitalSignature | null
  detraction?: DocumentDetraction | null
  conciliationItems?: any[]
  supportedExpenses?: any[]
}

export interface DocumentLine extends BaseEntity {
  documentId: string
  lineNumber: number
  productCode: string | null
  description: string
  quantity: string // Decimal en schema
  unitCode: string | null
  unitPrice: string // Decimal en schema
  unitPriceWithTax: string // Decimal en schema
  lineTotal: string // Decimal en schema
  igvAmount: string // Decimal en schema
  taxExemptionCode: string | null
  taxExemptionReason: string | null
  taxSchemeId: string | null
  priceTypeCode: string | null
  referencePrice: string | null // Decimal en schema
  itemClassificationCode: string | null
  freeOfChargeIndicator: boolean
  allowanceAmount: string // Decimal en schema
  allowanceIndicator: boolean
  chargeAmount: string // Decimal en schema
  chargeIndicator: boolean
  orderLineReference: string | null
  lineNotes: string | null
  taxableAmount: string // Decimal en schema
  exemptAmount: string // Decimal en schema
  inaffectedAmount: string // Decimal en schema
  xmlLineData: string | null

  // Relaciones
  document?: Document
  taxScheme?: {
    id: string
    taxSchemeName: string
    taxPercentage: number | null
  }
  accountLinks?: DocumentLineAccountLink[]
  costCenterLinks?: DocumentLineCostCenterLink[]
}

export interface DocumentPaymentTerm extends BaseEntity {
  documentId: string
  termNumber: number
  amount: string // Decimal en schema
  dueDate: Date
  description: string | null

  // Relaciones
  document?: Document
}

export interface DocumentXmlData extends BaseEntity {
  documentId: string
  xmlFileName: string | null
  xmlContent: string | null
  xmlHash: string | null
  xmlUblVersion: string | null
  xmlCustomizationId: string | null
  documentTypeDescription: string | null
  sunatResponseCode: string | null
  cdrStatus: string | null
  sunatProcessDate: Date | null
  pdfFile: string | null
  qrCode: string | null
  xmlAdditionalData: string | null

  // Relaciones
  document?: Document
}

export interface DocumentDigitalSignature extends BaseEntity {
  documentId: string
  digitalSignatureId: string | null
  digitalSignatureUri: string | null
  certificateIssuer: string | null
  certificateSubject: string | null
  signatureDate: Date | null
  signatureValue: string | null
  certificateData: string | null
  canonicalizationMethod: string | null
  signatureMethod: string | null
  digestMethod: string | null
  digestValue: string | null

  // Relaciones
  document?: Document
}

export interface DocumentDetraction extends BaseEntity {
  documentId: string
  hasDetraction: boolean
  amount: string // Decimal en schema
  code: string | null
  percentage: string // Decimal en schema
  serviceCode: string | null
  account: string | null
  paymentDate: Date | null
  paymentReference: string | null
  isConciliated: boolean
  conciliatedAmount: string // Decimal en schema
  pendingAmount: string // Decimal en schema
  conciliationId: string | null

  // Relaciones
  document?: Document
  conciliation?: any
}

export interface DocumentAccountLink extends BaseEntity {
  documentId: string
  accountId: string
  percentage: string // Decimal en schema
  amount: string // Decimal en schema

  // Relaciones
  document?: Document
  account?: {
    id: string
    accountCode: string
    accountName: string
  }
}

export interface DocumentCostCenterLink extends BaseEntity {
  documentId: string
  costCenterId: string
  percentage: string // Decimal en schema
  amount: string // Decimal en schema

  // Relaciones
  document?: Document
  costCenter?: {
    id: string
    code: string
    name: string
  }
}

export interface DocumentLineAccountLink extends BaseEntity {
  documentLineId: string
  accountId: string
  percentage: string // Decimal en schema
  amount: string // Decimal en schema

  // Relaciones
  documentLine?: DocumentLine
  account?: {
    id: string
    accountCode: string
    accountName: string
  }
}

export interface DocumentLineCostCenterLink extends BaseEntity {
  documentLineId: string
  costCenterId: string
  percentage: string // Decimal en schema
  amount: string // Decimal en schema

  // Relaciones
  documentLine?: DocumentLine
  costCenter?: {
    id: string
    code: string
    name: string
  }
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface DocumentQueryDto extends PaginationDto {
  supplierId?: string
  documentType?: DocumentType
  status?: DocumentStatus
  issueDateFrom?: string
  issueDateTo?: string
  dueDateFrom?: string
  dueDateTo?: string
  currency?: string
  minAmount?: number
  maxAmount?: number
  search?: string
  tags?: string
  hasRetention?: boolean
  hasDetraction?: boolean
  hasXmlData?: boolean
  hasDigitalSignature?: boolean
  accountId?: string
  costCenterId?: string
}

export interface CreateDocumentDto {
  companyId: string
  documentType: DocumentType
  series: string
  number: string
  supplierId: string
  issueDate: string | Date
  issueTime?: string | null
  dueDate?: string | Date | null
  receptionDate?: string | Date | null
  currency: string
  exchangeRate?: number
  subtotal: number
  igv: number
  otherTaxes?: number
  total: number
  hasRetention?: boolean
  retentionAmount?: number
  retentionPercentage?: number
  paymentMethod?: string | null
  description?: string | null
  observations?: string | null
  tags?: string | null
  status?: DocumentStatus
  orderReference?: string | null
  contractNumber?: string | null
  additionalNotes?: string | null
  documentNotes?: string | null
  operationNotes?: string | null
  createdById: string

  // Relaciones anidadas
  lines?: CreateDocumentLineDto[]
  paymentTerms?: CreateDocumentPaymentTermDto[]
  accountLinks?: CreateDocumentAccountLinkDto[]
  costCenterLinks?: CreateDocumentCostCenterLinkDto[]
  xmlData?: CreateDocumentXmlDataDto
  digitalSignature?: CreateDocumentDigitalSignatureDto
  detraction?: CreateDocumentDetractionDto
}

export interface CreateDocumentLineDto {
  productCode?: string | null
  description: string
  quantity: number
  unitCode?: string | null
  unitPrice: number
  unitPriceWithTax: number
  lineTotal: number
  igvAmount?: number
  taxExemptionCode?: string | null
  taxExemptionReason?: string | null
  taxSchemeId?: string | null
  priceTypeCode?: string | null
  referencePrice?: number | null
  itemClassificationCode?: string | null
  freeOfChargeIndicator?: boolean
  allowanceAmount?: number
  allowanceIndicator?: boolean
  chargeAmount?: number
  chargeIndicator?: boolean
  orderLineReference?: string | null
  lineNotes?: string | null
  taxableAmount?: number
  exemptAmount?: number
  inaffectedAmount?: number
  xmlLineData?: string | null

  // Relaciones anidadas
  accountLinks?: CreateDocumentLineAccountLinkDto[]
  costCenterLinks?: CreateDocumentLineCostCenterLinkDto[]
}

export interface CreateDocumentPaymentTermDto {
  amount: number
  dueDate: string | Date
  description?: string | null
}

export interface CreateDocumentXmlDataDto {
  xmlFileName?: string | null
  xmlContent?: string | null
  xmlHash?: string | null
  xmlUblVersion?: string | null
  xmlCustomizationId?: string | null
  documentTypeDescription?: string | null
  sunatResponseCode?: string | null
  cdrStatus?: string | null
  sunatProcessDate?: string | Date | null
  pdfFile?: string | null
  qrCode?: string | null
  xmlAdditionalData?: string | null
}

export interface CreateDocumentDigitalSignatureDto {
  digitalSignatureId?: string | null
  digitalSignatureUri?: string | null
  certificateIssuer?: string | null
  certificateSubject?: string | null
  signatureDate?: string | Date | null
  signatureValue?: string | null
  certificateData?: string | null
  canonicalizationMethod?: string | null
  signatureMethod?: string | null
  digestMethod?: string | null
  digestValue?: string | null
}

export interface CreateDocumentDetractionDto {
  hasDetraction?: boolean
  amount?: number
  code?: string | null
  percentage?: number
  serviceCode?: string | null
  account?: string | null
  paymentDate?: string | Date | null
  paymentReference?: string | null
  isConciliated?: boolean
  conciliatedAmount?: number
  pendingAmount?: number
  conciliationId?: string | null
}

export interface CreateDocumentAccountLinkDto {
  accountId: string
  percentage: number
  amount: number
}

export interface CreateDocumentCostCenterLinkDto {
  costCenterId: string
  percentage: number
  amount: number
}

export interface CreateDocumentLineAccountLinkDto {
  accountId: string
  percentage: number
  amount: number
}

export interface CreateDocumentLineCostCenterLinkDto {
  costCenterId: string
  percentage: number
  amount: number
}

export interface UpdateDocumentDto {
  documentType?: DocumentType
  series?: string
  number?: string
  supplierId?: string
  issueDate?: string | Date
  issueTime?: string | null
  dueDate?: string | Date | null
  receptionDate?: string | Date | null
  currency?: string
  exchangeRate?: number
  subtotal?: number
  igv?: number
  otherTaxes?: number
  total?: number
  hasRetention?: boolean
  retentionAmount?: number
  retentionPercentage?: number
  paymentMethod?: string | null
  description?: string | null
  observations?: string | null
  tags?: string | null
  status?: DocumentStatus
  orderReference?: string | null
  contractNumber?: string | null
  additionalNotes?: string | null
  documentNotes?: string | null
  operationNotes?: string | null
  updatedById: string

  // Relaciones anidadas (opcionales para actualización)
  lines?: CreateDocumentLineDto[]
  paymentTerms?: CreateDocumentPaymentTermDto[]
  accountLinks?: CreateDocumentAccountLinkDto[]
  costCenterLinks?: CreateDocumentCostCenterLinkDto[]
  xmlData?: CreateDocumentXmlDataDto
  digitalSignature?: CreateDocumentDigitalSignatureDto
  detraction?: CreateDocumentDetractionDto
}

export interface UpdateDocumentStatusDto {
  updatedById: string
}

export interface ConciliateDocumentDto {
  conciliatedAmount: number
}

export interface DocumentResponseDto extends Document {}

export interface DocumentSummaryResponseDto {
  totalDocuments: number
  statusCounts: Array<{
    status: DocumentStatus
    _count: { status: number }
    _sum: { total: number | null }
  }>
  monthlyTotals: Array<{
    month: string
    totalAmount: number
    documentCount: number
  }>
  currencySummary: Array<{
    currency: string
    totalAmount: number
    documentCount: number
  }>
  supplierSummary: Array<{
    supplierId: string
    supplierName: string
    totalAmount: number
    documentCount: number
  }>
}

// DTOs para operaciones bulk
export interface BulkUpdateStatusDto {
  documentIds: string[]
  status: DocumentStatus
  updatedById: string
}

export interface BulkDeleteDocumentsDto {
  documentIds: string[]
}


export interface PaginatedResponse<T> {
  data: T[]           // Array de elementos del tipo T
  pagination: {       // Información de paginación
    page: number      // Página actual (1, 2, 3...)
    limit: number     // Elementos por página (10, 20, 50...)
    total: number     // Total de elementos en la base de datos
    totalPages: number // Total de páginas disponibles
  }
}
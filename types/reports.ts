// Tipos de reportes (mantenemos compatibilidad)
export type ReportType = "expenses" | "reconciliation" | "detractions" | "retentions" | "movements" | "concar"
export type ReportFormat = "excel" | "pdf" | "csv" | "json"
export type ReportStatus = "pending" | "processing" | "completed" | "error"

export interface Report {
  id: string
  name: string
  type: ReportType
  format: ReportFormat
  status: ReportStatus
  parameters: ReportParameters
  filePath?: string
  fileSize?: number
  generatedAt?: string
  generatedBy: string
  expiresAt?: string
  downloadCount: number
  errorMessage?: string
  createdAt: string
}

export interface ReportParameters {
  dateFrom?: string
  dateTo?: string
  accounts?: string[]
  suppliers?: string[]
  documentTypes?: string[]
  status?: string[]
  currency?: string[]
  includeSubItems?: boolean
  groupBy?: string[]
  sortBy?: string
  sortOrder?: "asc" | "desc"
  filters?: Record<string, any>
}

export interface ReportTemplate {
  id: string
  name: string
  description: string
  type: ReportType
  defaultParameters: ReportParameters
  isPublic: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface ConcarExport {
  id: string
  period: string
  accountId: string
  totalRecords: number
  totalAmount: number
  filePath: string
  status: ReportStatus
  generatedAt: string
  generatedBy: string
}

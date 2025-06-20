export interface SunatRhe {
  id: string
  issueDate: string
  documentType: string
  documentNumber: string
  status: string
  issuerDocumentType: string
  issuerRuc: string
  issuerName: string
  rentType: string
  isFree: boolean
  description?: string
  observation?: string
  currency: string
  grossIncome: number
  incomeTax: number
  netIncome: number
  netPendingAmount?: number
  sourceFile: string
  companyId: string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface SunatInvoice {
  id: string
  period: string
  carSunat: string
  ruc: string
  name: string
  issueDate: string
  expirationDate?: string
  documentType: string
  series: string
  year?: string
  documentNumber: string
  identityDocumentType?: string
  identityDocumentNumber?: string
  customerName?: string
  taxableBase: number
  igv: number
  taxableBaseNg?: number
  igvNg?: number
  taxableBaseDng?: number
  igvDng?: number
  valueNgAcquisition?: number
  isc?: number
  icbper?: number
  otherCharges?: number
  total: number
  currency: string
  exchangeRate?: number
  modifiedIssueDate?: string
  modifiedDocType?: string
  modifiedDocSeries?: string
  modifiedDocNumber?: string
  damCode?: string
  goodsServicesClass?: string
  projectOperatorId?: string
  participationPercent?: number
  imb?: string
  carOrigin?: string
  detraction?: string
  noteType?: string
  invoiceStatus?: string
  incal?: string
  sourceFile: string
  companyId: string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface SunatStats {
  totalRheRecords: number
  totalInvoices: number
  currentMonthRhe: number
  currentMonthInvoices: number
  totalRheAmount: number
  totalInvoiceAmount: number
  lastImportDate?: string
}

export interface CreateSunatRheDto {
  issueDate: Date
  documentType: string
  documentNumber: string
  status: string
  issuerDocumentType: string
  issuerRuc: string
  issuerName: string
  rentType: string
  isFree: boolean
  description?: string
  observation?: string
  currency: string
  grossIncome: number
  incomeTax: number
  netIncome: number
  netPendingAmount?: number
  sourceFile: string
  companyId: string
  userId: string
}

export interface UpdateSunatRheDto extends Partial<CreateSunatRheDto> {}

export interface CreateSunatInvoiceDto {
  period: string
  carSunat: string
  ruc: string
  name: string
  issueDate: Date
  expirationDate?: Date
  documentType: string
  series: string
  year?: string
  documentNumber: string
  identityDocumentType?: string
  identityDocumentNumber?: string
  customerName?: string
  taxableBase: number
  igv: number
  taxableBaseNg?: number
  igvNg?: number
  taxableBaseDng?: number
  igvDng?: number
  valueNgAcquisition?: number
  isc?: number
  icbper?: number
  otherCharges?: number
  total: number
  currency: string
  exchangeRate?: number
  modifiedIssueDate?: Date
  modifiedDocType?: string
  modifiedDocSeries?: string
  modifiedDocNumber?: string
  damCode?: string
  goodsServicesClass?: string
  projectOperatorId?: string
  participationPercent?: number
  imb?: string
  carOrigin?: string
  detraction?: string
  noteType?: string
  invoiceStatus?: string
  incal?: string
  sourceFile: string
  companyId: string
  userId: string
}

export interface UpdateSunatInvoiceDto extends Partial<CreateSunatInvoiceDto> {}

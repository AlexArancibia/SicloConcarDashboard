import type { BaseEntity } from "./common"
import type { Company } from "./auth"
import type { BankAccount } from "./bank-accounts"
import type { Supplier } from "./suppliers"
import type { Document } from "./documents"
import type { User } from "./auth"

// Tipos de gastos basados en el schema de Prisma
export type ExpenseStatus = "IMPORTED" | "PROCESSED" | "CONCILIATED" | "EXPORTED"
export type ExpenseType =
  | "BANK_TRANSACTION"
  | "ITF"
  | "DETRACTION"
  | "PAYMENT"
  | "SERVICE"
  | "RENT"
  | "UTILITIES"
  | "BANK_FEE"
  | "OTHER"

export interface Expense extends BaseEntity {
  companyId: string
  company?: Company

  // Información del archivo de gastos (línea del Excel)
  lineNumber: number // No (correlativo de línea)
  bankAccountId: string // Cuenta bancaria de origen
  bankAccount?: BankAccount

  // Datos del movimiento bancario original (copiados de Transaction)
  transactionDate: string // Fecha del movimiento
  valueDate: string | null // Fecha valuta
  operationDesc: string // Descripción operación
  amount: number // Monto (negativo para gastos)
  balance: number // Saldo después del movimiento
  branch: string | null // Sucursal - agencia
  operationNumber: string // Operación - Número
  operationTime: string | null // Operación - Hora
  user: string | null // Usuario que realizó la operación
  utc: string | null // UTC
  reference2: string | null // Referencia2

  // Clasificación contable (del archivo de gastos)
  documentType: string | null // Tipo de documento (I-Banco, IR, R-Servicio, etc.)
  fiscalFolio: string | null // Folio Fiscal (Serie-Número del documento)
  supplierName: string | null // Proveedor (nombre)
  concept: string | null // Concepto
  totalAmount: number | null // Total
  subtotal: number | null // Subtotal
  igv: number | null // IGV
  isr: number | null // ISR (Retención de 4ta)

  // Clasificación organizacional
  discipline: string | null // Disciplina
  location: string | null // Location
  generalCategory: string | null // General
  type: string | null // Tipo
  account: string | null // Cuenta
  subAccount: string | null // Subcuenta
  accountingMonth: string | null // Mes Contable
  accountingAccount: string | null // Cuenta Contable
  comments: string | null // Comentarios

  // Información del proveedor
  supplierRuc: string | null // RUC
  documentDate: string | null // Fecha de comprobante
  issueDate: string | null // Emisión de comprobante
  dueDate: string | null // Fecha de Vencimiento
  isMassive: boolean // Masivo

  // Clasificación automática
  expenseType: ExpenseType // Tipo de gasto inferido
  currency: string // Moneda

  // Referencias a otras entidades (resultado de la conciliación)
  supplierId: string | null // Proveedor relacionado
  supplier?: Supplier | null
  documentId: string | null // Documento relacionado
  document?: Document | null

  // Estado del procesamiento
  status: ExpenseStatus

  // Información de importación simplificada
  originalFileName: string | null // Nombre del archivo Excel original
  rowHash: string | null // Hash de la fila para evitar duplicados

  // Auditoría
  importedAt: string
  importedById: string
  importedBy?: User
  processedAt: string | null
  processedById: string | null
  processedBy?: User | null
  reconciledAt: string | null
  reconciledById: string | null
  reconciledBy?: User | null
}

// Legacy types for compatibility
export interface ExpenseCategory extends BaseEntity {
  code: string
  name: string
  description: string
  parentId?: string
  isActive: boolean
}

export interface ExpenseAccount extends BaseEntity {
  code: string
  name: string
  description: string
  accountType: string
  parentId?: string
  isActive: boolean
}

export interface ExpenseApproval extends BaseEntity {
  expenseId: string
  approverLevel: number
  approverId: string
  approverName: string
  status: "pending" | "approved" | "rejected"
  comments?: string
  approvedAt?: string
}

import type { BaseEntity } from "./common"
import type { Company } from "./auth"
import type { BankAccount } from "./bank-accounts"
import type { Supplier } from "./suppliers"
import { Conciliation } from "./conciliation"

// Tipos de transacciones basados en el schema de Prisma
export type TransactionType = "DEBIT" | "CREDIT"
export type TransactionStatus = "IMPORTED" | "PENDING" | "CONCILIATED" | "PARTIALLY_CONCILIATED" | "EXCLUDED"

// DTO para crear transacciones (coincide con CreateTransactionDto del backend)
export interface CreateTransactionDto {
  companyId: string
  bankAccountId: string
  transactionDate: string // ISO 8601 date string
  valueDate?: string // ISO 8601 date string opcional
  description: string
  transactionType: TransactionType
  amount: number // máximo 2 decimales
  balance: number // máximo 2 decimales
  branch?: string
  operationNumber: string
  operationTime?: string
  operatorUser?: string
  utc?: string
  reference?: string
  channel?: string
  fileName?: string
  isITF?: boolean
  isDetraction?: boolean
  isBankFee?: boolean
  isTransfer?: boolean
  supplierId?: string
}

export interface Transaction extends BaseEntity {
  companyId: string
  company?: Company

  // Información de la cuenta bancaria
  bankAccountId: string
  bankAccount?: BankAccount

  // Datos de la transacción bancaria (del Excel)
  transactionDate: string // Fecha de la transacción
  valueDate: string | null // Fecha valor
  description: string // Descripción de la operación
  transactionType: TransactionType // Débito o Crédito
  amount: number // Monto (siempre positivo)
  balance: number // Saldo después de la transacción

  // Información adicional del banco
  branch: string | null // Sucursal
  operationNumber: string // Número de operación (único por cuenta)
  operationTime: string | null // Hora de la operación
  operatorUser: string | null // Usuario que realizó la operación
  utc: string | null // UTC
  reference: string | null // Referencia adicional
  channel: string | null // Canal (Online, ATM, Sucursal, etc.)

  // Información de importación simplificada
  fileName: string | null // Nombre del archivo importado
  importedAt: string // Fecha de importación

  // Clasificación automática
  isITF: boolean // Es Impuesto a las Transacciones Financieras
  isDetraction: boolean // Es detracción masiva
  isBankFee: boolean // Es comisión bancaria
  isTransfer: boolean // Es transferencia

  // Relación con proveedores (inferida)
  supplierId: string | null
  supplier?: Supplier | null

  // Estado de conciliación
  status: TransactionStatus
  conciliatedAmount: number // Monto ya conciliado
  pendingAmount: number // Monto pendiente de conciliar

  // Hash único para evitar duplicados
  transactionHash: string // Hash basado en cuenta + fecha + monto + operación
  conciliation?: Conciliation | null
}

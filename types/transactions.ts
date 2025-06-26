import type { BaseEntity, PaginationDto } from "./common"
import type { Company } from "./auth"

// Actualizar los enums para que coincidan con el schema de Prisma
export type TransactionType =
  // ==================== INGRESOS ====================
  /** Nómina */
  | "INCOME_SALARY"         // Haberes, sueldos
  | "INCOME_BONUS"          // Bonificaciones
  
  /** Financieros */
  | "INCOME_INTEREST"       // Intereses bancarios
  | "INCOME_INVESTMENT"     // Rendimiento de inversiones
  | "INCOME_DIVIDENDS"      // Dividendos
  
  /** Ventas */
  | "INCOME_SALES"          // Ingresos por ventas
  | "INCOME_SERVICES"       // Ingresos por servicios
  
  /** Transferencias */
  | "INCOME_TRANSFER"       // Transferencias recibidas
  | "INCOME_DEPOSIT"        // Depósitos directos
  
  /** Reembolsos */
  | "INCOME_REFUND"         // Reembolsos
  | "INCOME_ADJUSTMENT"     // Ajustes positivos
  | "INCOME_TAX_REFUND"     // Devolución de impuestos
  
  /** Otros */
  | "INCOME_OTHER"          // Otros ingresos varios

  // ==================== EGRESOS ====================
  /** Nómina */
  | "PAYROLL_SALARY"        // Sueldos
  | "PAYROLL_CTS"           // CTS
  | "PAYROLL_BONUS"         // Gratificaciones o bonos
  | "PAYROLL_AFP"           // Aportes a AFP

  /** Impuestos */
  | "TAX_PAYMENT"           // SUNAT, IGV, Renta, etc.
  | "TAX_ITF"               // Impuesto a las transacciones financieras
  | "TAX_DETRACTION"        // Pagos de detracción

  /** Servicios */
  | "EXPENSE_UTILITIES"     // Servicios como luz, agua, internet
  | "EXPENSE_INSURANCE"     // Seguros (ej. MAPFRE)
  | "EXPENSE_COMMISSIONS"   // Comisiones, mantenimiento, portes

  /** Transacciones */
  | "EXPENSE_PURCHASE"      // Pago a proveedores
  | "TRANSFER_INBANK"       // Transferencia dentro del mismo banco
  | "TRANSFER_EXTERNAL"     // Transferencia interbancaria (CCE, etc.)
  | "WITHDRAWAL_CASH"       // Retiro de efectivo

  /** Varios */
  | "EXPENSE_OTHER"         // Egresos varios
  | "ADJUSTMENT"            // Ajustes o regularizaciones
  | "REFUND";               // Reembolso o devolución
export type TransactionStatus = "PENDING" | "PROCESSED" | "RECONCILED" | "CANCELLED"

// ============================================================================
// INTERFACES PRINCIPALES
// ============================================================================

// En la interface Transaction, actualizar los campos opcionales
export interface Transaction extends BaseEntity {
  companyId: string
  bankAccountId: string
  transactionDate: Date
  valueDate: Date | null
  description: string
  transactionType: TransactionType
  amount: string // Decimal en schema
  balance: string // Decimal en schema
  branch: string | null
  operationNumber: string | null
  operationTime: string | null
  operatorUser: string | null
  utc: string | null
  reference: string | null
  channel: string | null
  fileName: string | null
  importedAt: Date | null
  status: TransactionStatus
  conciliatedAmount: string | null // Ahora es opcional en el schema
  pendingAmount: string | null // Ahora es opcional en el schema
  transactionHash: string

  // Relaciones expandidas se mantienen igual
  company?: Company
  bankAccount?: {
    id: string
    accountNumber: string
    alias: string | null
    bank: {
      name: string
      code: string
    }
    currencyRef: {
      code: string
      name: string
      symbol: string
    }
  }
  supplier?: {
    id: string
    businessName: string
    documentNumber: string
  } | null
  conciliations?: Array<{
    id: string
    reference: string | null
    status: string
    totalAmount: string | null
    createdAt: Date
  }>
}



// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================


export interface TransactionQueryDto extends PaginationDto {
  status?: TransactionStatus;
  type?: string; // O un enum específico si lo tienes
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  bankAccountId?: string;
  minAmount?: string;
  maxAmount?: string;
  reference?: string;
  operationNumber?: string;
  channel?: string;
}

export interface TransactionPaginatedResponse {
  data: Transaction[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// En CreateTransactionDto, actualizar campos opcionales
export interface CreateTransactionDto {
  companyId: string
  bankAccountId: string
  transactionDate: Date | string
  valueDate?: Date | string | null
  description: string
  transactionType: TransactionType
  amount: number
  balance: number
  branch?: string | null
  operationNumber?: string | null
  operationTime?: string | null
  operatorUser?: string | null
  utc?: string | null
  reference?: string | null
  channel?: string | null
  fileName?: string | null
  importedAt?: Date | string | null
  status?: TransactionStatus
  conciliatedAmount?: number | null // Ahora opcional
  pendingAmount?: number | null // Ahora opcional
}

// En UpdateTransactionDto, actualizar campos opcionales
export interface UpdateTransactionDto {
  transactionDate?: Date | string
  valueDate?: Date | string | null
  description?: string
  transactionType?: TransactionType
  amount?: number
  balance?: number
  branch?: string | null
  operationNumber?: string | null
  operationTime?: string | null
  operatorUser?: string | null
  utc?: string | null
  reference?: string | null
  channel?: string | null
  fileName?: string | null
  importedAt?: Date | string | null
  status?: TransactionStatus
  conciliatedAmount?: number | null // Ahora opcional
  pendingAmount?: number | null // Ahora opcional
}

export interface ImportTransactionsDto {
  companyId: string
  bankAccountId: string
  file: File
}

export interface ImportTransactionsResult {
  imported: number
  duplicates: number
  errors: string[]
}

export interface TransactionStats {
  total: number
  byStatus: Record<string, { count: number; amount: number }>
}

export interface UpdateTransactionStatusDto {
  status: TransactionStatus
}

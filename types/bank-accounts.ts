import type { BaseEntity } from "./common"
import type { Company } from "./auth"

// Tipos de cuentas bancarias basados en el schema de Prisma
export type BankAccountType = "CORRIENTE" | "AHORROS" | "PLAZO_FIJO" | "CTS" | "DETRACCIONES" | "OTROS"

export interface BankAccount extends BaseEntity {
  companyId: string
  company?: Company

  // Información de la cuenta
  bankName: string // Nombre del banco
  bankCode: string | null // Código del banco
  accountNumber: string // Número de cuenta
  accountType: BankAccountType // Tipo de cuenta
  currency: string // Moneda

  // Información adicional
  alias: string | null // Alias o nombre descriptivo
  description: string | null // Descripción
  isActive: boolean

  // Saldos
  initialBalance: number
  currentBalance: number
}

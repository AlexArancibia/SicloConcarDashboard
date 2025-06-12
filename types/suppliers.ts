import type { BaseEntity } from "./common"
import type { Company } from "./auth"

// Tipos de proveedores basados en el schema de Prisma
export type SupplierType = "PERSONA_NATURAL" | "PERSONA_JURIDICA" | "EXTRANJERO"
export type SupplierStatus = "ACTIVE" | "INACTIVE" | "BLOCKED" | "PENDING_VALIDATION"

export interface Supplier extends BaseEntity {
  companyId: string
  company?: Company

  // Información básica
  businessName: string // Razón social o nombre completo
  tradeName: string | null // Nombre comercial
  documentType: string // Tipo de documento (RUC, DNI, CE, etc.)
  documentNumber: string // Número de documento
  supplierType: SupplierType // Tipo de proveedor

  // Información de contacto
  email: string | null
  phone: string | null
  address: string | null
  district: string | null
  province: string | null
  department: string | null
  country: string | null

  // Información bancaria
  bankAccounts?: SupplierBankAccount[]

  // Estado y configuración
  status: SupplierStatus
  creditLimit: number | null
  paymentTerms: number | null // Días de plazo de pago

  // Información tributaria
  taxCategory: string | null // Categoría tributaria
  isRetentionAgent: boolean // Es agente de retención
  retentionRate: number | null // Tasa de retención

  // Relaciones
  contacts?: SupplierContact[]
}

export interface SupplierContact extends BaseEntity {
  supplierId: string
  name: string
  position: string
  phone: string
  email: string
  isPrimary: boolean
}

export interface SupplierBankAccount extends BaseEntity {
  supplierId: string
  bankCode: string
  bankName: string
  accountNumber: string
  accountType: string
  currency: string
  isActive: boolean
}

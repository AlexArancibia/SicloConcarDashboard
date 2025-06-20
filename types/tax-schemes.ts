import type { BaseEntity } from "./common"

// ============================================================================
// INTERFACES PRINCIPALES
// ============================================================================

export interface TaxScheme extends BaseEntity {
  taxSchemeId: string
  taxSchemeName: string
  taxCategoryId: string | null
  taxTypeCode: string | null
  taxPercentage: number | null
  description: string | null
  isActive: boolean
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface CreateTaxSchemeDto {
  taxSchemeId: string
  taxSchemeName: string
  taxCategoryId?: string | null
  taxTypeCode?: string | null
  taxPercentage?: number | null
  description?: string | null
  isActive?: boolean
}

export interface UpdateTaxSchemeDto {
  taxSchemeId?: string
  taxSchemeName?: string
  taxCategoryId?: string | null
  taxTypeCode?: string | null
  taxPercentage?: number | null
  description?: string | null
  isActive?: boolean
}

export interface TaxSchemeFilters {
  search?: string
  isActive?: boolean
  taxTypeCode?: string
}

export interface TaxSchemeResponseDto extends TaxScheme {}

// ============================================================================
// CONSTANTES
// ============================================================================

export const TAX_SCHEME_NAMES = {
  IGV: "IGV",
  ISC: "ISC",
  EXONERADO: "Exonerado",
  INAFECTO: "Inafecto",
  OTROS: "Otros",
} as const

export const TAX_SCHEME_IDS = {
  IGV: "1000",
  ISC: "2000",
  EXONERADO: "9997",
  INAFECTO: "9998",
  OTROS: "9999",
} as const

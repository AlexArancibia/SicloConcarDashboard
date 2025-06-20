/**
 * Tipos comunes utilizados en toda la aplicación
 */

// Tipos de paginación
export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

 

// Tipos de filtros
export interface FilterParams {
  search?: string
  dateFrom?: string
  dateTo?: string
  status?: string[]
  type?: string[]
  [key: string]: any
}

// Respuesta API estándar
 

// Resultado de subida de archivos
export interface UploadResult {
  success: boolean
  fileName: string
  filePath: string
  fileSize: number
  recordsProcessed: number
  recordsSuccess: number
  recordsError: number
  errors: string[]
  warnings: string[]
}

// Notificaciones
export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  isRead: boolean
  actionUrl?: string
  createdAt: string
  readAt?: string
}

// Tipos de moneda
export type Currency = "PEN" | "USD" | "EUR"

// Tipos de estado genéricos
export type Status = "active" | "inactive" | "pending" | "blocked"

// Tipos para formularios
export interface FormState {
  isLoading: boolean
  error: string | null
  success: boolean
}

// Tipos para modales
export interface ModalState {
  isOpen: boolean
  data?: any
}

// Entidad base con campos comunes
export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

export interface PaginationDto {
  page?: number
  limit?: number
}
 
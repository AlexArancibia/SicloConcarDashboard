import { create } from "zustand"
import apiClient from "@/lib/axiosConfig"

export interface AuditLog {
  id: string
  userId: string
  action: string
  entity: string
  entityId?: string
  description?: string
  oldValues?: any
  newValues?: any
  ipAddress?: string
  userAgent?: string
  createdAt: string
  companyId: string
  user: {
    id: string
    firstName?: string
    lastName?: string
    email: string
  }
}

export interface AuditLogsState {
  auditLogs: AuditLog[]
  loading: boolean
  error: string | null
  total: number
  page: number
  limit: number
  totalPages: number
  fetchAuditLogs: (companyId: string, pagination?: { page?: number; limit?: number }) => Promise<void>
  getAuditLogsByUser: (companyId: string, userId: string, pagination?: { page?: number; limit?: number }) => Promise<void>
  getAuditLogsByEntity: (companyId: string, entity: string, entityId: string, pagination?: { page?: number; limit?: number }) => Promise<void>
  clearError: () => void
}

export const useAuditLogsStore = create<AuditLogsState>((set, get) => ({
  auditLogs: [],
  loading: false,
  error: null,
  total: 0,
  page: 1,
  limit: 25,
  totalPages: 0,

  fetchAuditLogs: async (companyId: string, pagination = {}) => {
    set({ loading: true, error: null })
    try {
      const { page = 1, limit = 25 } = pagination
      const response = await apiClient.get(`/audit-logs`, {
        params: { page, limit }
      })

      set({
        auditLogs: response.data.data,
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit,
        totalPages: response.data.totalPages,
        loading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching audit logs",
        loading: false,
      })
    }
  },

  getAuditLogsByUser: async (companyId: string, userId: string, pagination = {}) => {
    set({ loading: true, error: null })
    try {
      const { page = 1, limit = 25 } = pagination
      const response = await apiClient.get(`/audit-logs/user/${userId}`, {
        params: { page, limit }
      })

      set({
        auditLogs: response.data.data,
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit,
        totalPages: response.data.totalPages,
        loading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching user audit logs",
        loading: false,
      })
    }
  },

  getAuditLogsByEntity: async (companyId: string, entity: string, entityId: string, pagination = {}) => {
    set({ loading: true, error: null })
    try {
      const { page = 1, limit = 25 } = pagination
      const response = await apiClient.get(`/audit-logs/entity/${entity}/${entityId}`, {
        params: { page, limit }
      })

      set({
        auditLogs: response.data.data,
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit,
        totalPages: response.data.totalPages,
        loading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching entity audit logs",
        loading: false,
      })
    }
  },

  clearError: () => set({ error: null }),
}))

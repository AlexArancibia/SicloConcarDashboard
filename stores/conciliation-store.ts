import { create } from "zustand"
import type {
  Conciliation,
  ConciliationItem,
  ConciliationStatus,
  CreateConciliationDto,
  UpdateConciliationDto,
  CreateConciliationItemDto,
  UpdateConciliationItemDto,
  ValidateConciliationResponse,
  AutoConciliationResponse,
} from "@/types"
import apiClient from "@/lib/axiosConfig"

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface ConciliationState {
  conciliations: Conciliation[]
  conciliationItems: ConciliationItem[]
  loading: boolean
  error: string | null
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }

  // CRUD methods for conciliations
  fetchConciliations: (companyId: string, page?: number, limit?: number) => Promise<void>
  createConciliation: (conciliationData: CreateConciliationDto) => Promise<Conciliation | null>
  updateConciliation: (id: string, updates: UpdateConciliationDto) => Promise<void>
  deleteConciliation: (id: string) => Promise<void>
  getConciliationById: (id: string) => Promise<Conciliation | null>

  // CRUD methods for conciliation items
  fetchConciliationItems: (conciliationId: string) => Promise<void>
  createConciliationItem: (itemData: CreateConciliationItemDto) => Promise<ConciliationItem | null>
  updateConciliationItem: (id: string, updates: UpdateConciliationItemDto) => Promise<void>
  deleteConciliationItem: (id: string) => Promise<void>
  getConciliationItemById: (id: string) => Promise<ConciliationItem | null>

  // Special operations
  performAutoConciliation: (conciliationId: string) => Promise<AutoConciliationResponse | null>
  completeConciliation: (conciliationId: string) => Promise<Conciliation | null>
  validateConciliation: (
    transactionId: string,
    documentIds: string[],
    tolerance?: number,
  ) => Promise<ValidateConciliationResponse | null>

  // Utility methods
  getConciliationsByStatus: (status: ConciliationStatus) => Conciliation[]
  getItemsByConciliation: (conciliationId: string) => ConciliationItem[]
  clearConciliations: () => void
  clearError: () => void

  // Statistics and status methods
  updateConciliationStatus: (id: string, status: ConciliationStatus) => Promise<void>
  getConciliationStats: () => {
    total: number
    pending: number
    inProgress: number
    completed: number
    reviewed: number
    approved: number
    byStatus: Record<ConciliationStatus, number>
  }
}

export const useConciliationStore = create<ConciliationState>((set, get) => ({
  conciliations: [],
  conciliationItems: [],
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },

  fetchConciliations: async (companyId: string, page = 1, limit = 1000) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<PaginatedResponse<Conciliation>>(
        `/conciliations/company/${companyId}?page=${page}&limit=${limit}`,
      )

      const { data, total, totalPages } = response.data

      set({
        conciliations: data,
        pagination: { total, page, limit, totalPages },
        loading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching conciliations",
        loading: false,
      })
    }
  },

  createConciliation: async (conciliationData: CreateConciliationDto) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<Conciliation>("/conciliations", conciliationData)
      const newConciliation = response.data

      set((state) => ({
        conciliations: [newConciliation, ...state.conciliations],
        loading: false,
      }))

      return newConciliation
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error creating conciliation",
        loading: false,
      })
      return null
    }
  },

  updateConciliation: async (id: string, updates: UpdateConciliationDto) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.patch<Conciliation>(`/conciliations/${id}`, updates)
      const updatedConciliation = response.data

      set((state) => ({
        conciliations: state.conciliations.map((conciliation) =>
          conciliation.id === id ? updatedConciliation : conciliation,
        ),
        loading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error updating conciliation",
        loading: false,
      })
    }
  },

  deleteConciliation: async (id: string) => {
    set({ loading: true, error: null })
    try {
      await apiClient.delete(`/conciliations/${id}`)

      set((state) => ({
        conciliations: state.conciliations.filter((conciliation) => conciliation.id !== id),
        loading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error deleting conciliation",
        loading: false,
      })
    }
  },

  getConciliationById: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Conciliation>(`/conciliations/${id}`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching conciliation",
        loading: false,
      })
      return null
    }
  },

  fetchConciliationItems: async (conciliationId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<ConciliationItem[]>(`/conciliations/${conciliationId}/items`)

      set({
        conciliationItems: response.data,
        loading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching conciliation items",
        loading: false,
      })
    }
  },

  createConciliationItem: async (itemData: CreateConciliationItemDto) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<ConciliationItem>("/conciliations/items", itemData)
      const newItem = response.data

      set((state) => ({
        conciliationItems: [newItem, ...state.conciliationItems],
        loading: false,
      }))

      return newItem
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error creating conciliation item",
        loading: false,
      })
      return null
    }
  },

  updateConciliationItem: async (id: string, updates: UpdateConciliationItemDto) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.patch<ConciliationItem>(`/conciliations/items/${id}`, updates)
      const updatedItem = response.data

      set((state) => ({
        conciliationItems: state.conciliationItems.map((item) => (item.id === id ? updatedItem : item)),
        loading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error updating conciliation item",
        loading: false,
      })
    }
  },

  deleteConciliationItem: async (id: string) => {
    set({ loading: true, error: null })
    try {
      await apiClient.delete(`/conciliations/items/${id}`)

      set((state) => ({
        conciliationItems: state.conciliationItems.filter((item) => item.id !== id),
        loading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error deleting conciliation item",
        loading: false,
      })
    }
  },

  getConciliationItemById: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<ConciliationItem>(`/conciliations/items/${id}`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching conciliation item",
        loading: false,
      })
      return null
    }
  },

  performAutoConciliation: async (conciliationId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<AutoConciliationResponse>(
        `/conciliations/${conciliationId}/auto-conciliate`,
      )
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error performing auto conciliation",
        loading: false,
      })
      return null
    }
  },

  completeConciliation: async (conciliationId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<Conciliation>(`/conciliations/${conciliationId}/complete`)
      const completedConciliation = response.data

      set((state) => ({
        conciliations: state.conciliations.map((conciliation) =>
          conciliation.id === conciliationId ? completedConciliation : conciliation,
        ),
        loading: false,
      }))

      return completedConciliation
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error completing conciliation",
        loading: false,
      })
      return null
    }
  },

  validateConciliation: async (transactionId: string, documentIds: string[], tolerance = 30) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<ValidateConciliationResponse>(`/conciliations/validate`, {
        transactionId,
        documentIds,
        tolerance,
      })
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error validating conciliation",
        loading: false,
      })
      return null
    }
  },

  getConciliationsByStatus: (status: ConciliationStatus) => {
    return get().conciliations.filter((conciliation) => conciliation.status === status)
  },

  getItemsByConciliation: (conciliationId: string) => {
    return get().conciliationItems.filter((item) => item.conciliationId === conciliationId)
  },

  clearConciliations: () => {
    set({
      conciliations: [],
      conciliationItems: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
    })
  },

  clearError: () => {
    set({ error: null })
  },

  updateConciliationStatus: async (id: string, status: ConciliationStatus) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.patch<Conciliation>(`/conciliations/${id}`, { status })
      const updatedConciliation = response.data

      set((state) => ({
        conciliations: state.conciliations.map((conciliation) =>
          conciliation.id === id ? updatedConciliation : conciliation,
        ),
        loading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error updating conciliation status",
        loading: false,
      })
    }
  },

  getConciliationStats: () => {
    const conciliations = get().conciliations
    const stats = {
      total: conciliations.length,
      pending: 0,
      inProgress: 0,
      completed: 0,
      reviewed: 0,
      approved: 0,
      byStatus: {} as Record<ConciliationStatus, number>,
    }

    // Initialize byStatus
    const statuses: ConciliationStatus[] = ["PENDING", "IN_PROGRESS", "COMPLETED", "REVIEWED", "APPROVED"]
    statuses.forEach((status) => {
      stats.byStatus[status] = 0
    })

    // Count by status
    conciliations.forEach((conciliation) => {
      stats.byStatus[conciliation.status]++
      switch (conciliation.status) {
        case "PENDING":
          stats.pending++
          break
        case "IN_PROGRESS":
          stats.inProgress++
          break
        case "COMPLETED":
          stats.completed++
          break
        case "REVIEWED":
          stats.reviewed++
          break
        case "APPROVED":
          stats.approved++
          break
      }
    })

    return stats
  },
}))

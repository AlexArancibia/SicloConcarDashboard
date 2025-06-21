import { create } from "zustand"
import type {
  Conciliation,
  ConciliationItem,
  ConciliationExpense,
  ConciliationPaginatedResponse,
  CreateConciliationDto,
  UpdateConciliationDto,
  CreateConciliationItemDto,
  UpdateConciliationItemDto,
  UpdateConciliationExpenseDto,
  ConciliationFiltersDto,
  ValidateConciliationDto,
  ConciliationValidationResult,
  AutoConciliationResult,
  ConciliationStatistics,
  BulkOperationResult,
  ExportConciliationsResult,
  PendingDocument,
  UnmatchedTransaction,
  PaginationDto,
} from "@/types/conciliation"
import apiClient from "@/lib/axiosConfig"

interface ConciliationsState {
  conciliations: Conciliation[]
  currentConciliation: Conciliation | null
  conciliationItems: ConciliationItem[]
  conciliationExpenses: ConciliationExpense[]
  loading: boolean
  error: string | null
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }

  // Métodos principales de conciliación
  fetchConciliations: (companyId: string, pagination?: PaginationDto) => Promise<void>
  createConciliation: (createConciliationDto: CreateConciliationDto) => Promise<Conciliation | null>
  getConciliationById: (id: string) => Promise<Conciliation | null>
  updateConciliation: (id: string, updateConciliationDto: UpdateConciliationDto) => Promise<void>
  deleteConciliation: (id: string) => Promise<void>

  // Métodos de finalización y automatización
  completeConciliation: (id: string) => Promise<Conciliation | null>
  performAutomaticConciliation: (id: string) => Promise<AutoConciliationResult | null>
  validateConciliation: (validateDto: ValidateConciliationDto) => Promise<ConciliationValidationResult | null>

  // Métodos de ConciliationItem
  createConciliationItem: (createItemDto: CreateConciliationItemDto) => Promise<ConciliationItem | null>
  getConciliationItemById: (id: string) => Promise<ConciliationItem | null>
  updateConciliationItem: (id: string, updateItemDto: UpdateConciliationItemDto) => Promise<void>
  deleteConciliationItem: (id: string) => Promise<void>
  getConciliationItemsByConciliation: (conciliationId: string) => Promise<void>

  // Métodos de ConciliationExpense
  createConciliationExpense: (createExpenseDto: any) => Promise<ConciliationExpense | null>
  getConciliationExpenseById: (id: string) => Promise<ConciliationExpense | null>
  updateConciliationExpense: (id: string, updateExpenseDto: UpdateConciliationExpenseDto) => Promise<void>
  deleteConciliationExpense: (id: string) => Promise<void>
  getConciliationExpensesByConciliation: (conciliationId: string) => Promise<void>

  // Métodos avanzados
  fetchConciliationsAdvanced: (companyId: string, filters: ConciliationFiltersDto) => Promise<void>
  getConciliationStatistics: (
    companyId: string,
    startDate?: string,
    endDate?: string,
  ) => Promise<ConciliationStatistics | null>

  // Operaciones bulk
  bulkCompleteConciliations: (conciliationIds: string[]) => Promise<BulkOperationResult[]>
  bulkAutoConciliate: (conciliationIds: string[]) => Promise<BulkOperationResult[]>

  // Exportación
  exportConciliations: (
    companyId: string,
    format: "csv" | "excel",
    filters: ConciliationFiltersDto,
  ) => Promise<ExportConciliationsResult | null>

  // Documentos y transacciones pendientes
  getPendingDocumentsForConciliation: (
    companyId: string,
    startDate?: string,
    endDate?: string,
    bankAccountId?: string,
  ) => Promise<PendingDocument[]>
  getUnmatchedTransactions: (
    companyId: string,
    startDate?: string,
    endDate?: string,
    bankAccountId?: string,
  ) => Promise<UnmatchedTransaction[]>

  // Métodos utilitarios
  setCurrentConciliation: (conciliation: Conciliation | null) => void
  clearConciliations: () => void
  clearError: () => void
}

export const useConciliationsStore = create<ConciliationsState>((set, get) => ({
  conciliations: [],
  currentConciliation: null,
  conciliationItems: [],
  conciliationExpenses: [],
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },

  fetchConciliations: async (companyId: string, pagination: PaginationDto = {}) => {
    set({ loading: true, error: null })
    try {
      const { page = 1, limit = 10 } = pagination
      const response = await apiClient.get<ConciliationPaginatedResponse>(
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

  createConciliation: async (createConciliationDto: CreateConciliationDto) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<Conciliation>("/conciliations", createConciliationDto)
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

  getConciliationById: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Conciliation>(`/conciliations/${id}`)
      const conciliation = response.data

      set({
        currentConciliation: conciliation,
        loading: false,
      })

      return conciliation
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching conciliation",
        loading: false,
      })
      return null
    }
  },

  updateConciliation: async (id: string, updateConciliationDto: UpdateConciliationDto) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.patch<Conciliation>(`/conciliations/${id}`, updateConciliationDto)
      const updatedConciliation = response.data

      set((state) => ({
        conciliations: state.conciliations.map((conciliation) =>
          conciliation.id === id ? updatedConciliation : conciliation,
        ),
        currentConciliation: state.currentConciliation?.id === id ? updatedConciliation : state.currentConciliation,
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
        currentConciliation: state.currentConciliation?.id === id ? null : state.currentConciliation,
        loading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error deleting conciliation",
        loading: false,
      })
    }
  },

  completeConciliation: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<Conciliation>(`/conciliations/${id}/complete`)
      const completedConciliation = response.data

      set((state) => ({
        conciliations: state.conciliations.map((conciliation) =>
          conciliation.id === id ? completedConciliation : conciliation,
        ),
        currentConciliation: state.currentConciliation?.id === id ? completedConciliation : state.currentConciliation,
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

  performAutomaticConciliation: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<AutoConciliationResult>(`/conciliations/${id}/auto-conciliate`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error performing automatic conciliation",
        loading: false,
      })
      return null
    }
  },

  validateConciliation: async (validateDto: ValidateConciliationDto) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<ConciliationValidationResult>("/conciliations/validate", validateDto)
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

  createConciliationItem: async (createItemDto: CreateConciliationItemDto) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<ConciliationItem>("/conciliations/items", createItemDto)
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

  updateConciliationItem: async (id: string, updateItemDto: UpdateConciliationItemDto) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.patch<ConciliationItem>(`/conciliations/items/${id}`, updateItemDto)
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

  getConciliationItemsByConciliation: async (conciliationId: string) => {
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

  createConciliationExpense: async (createExpenseDto: any) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<ConciliationExpense>("/conciliations/expenses", createExpenseDto)
      const newExpense = response.data

      set((state) => ({
        conciliationExpenses: [newExpense, ...state.conciliationExpenses],
        loading: false,
      }))

      return newExpense
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error creating conciliation expense",
        loading: false,
      })
      return null
    }
  },

  getConciliationExpenseById: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<ConciliationExpense>(`/conciliations/expenses/${id}`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching conciliation expense",
        loading: false,
      })
      return null
    }
  },

  updateConciliationExpense: async (id: string, updateExpenseDto: UpdateConciliationExpenseDto) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.patch<ConciliationExpense>(`/conciliations/expenses/${id}`, updateExpenseDto)
      const updatedExpense = response.data

      set((state) => ({
        conciliationExpenses: state.conciliationExpenses.map((expense) =>
          expense.id === id ? updatedExpense : expense,
        ),
        loading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error updating conciliation expense",
        loading: false,
      })
    }
  },

  deleteConciliationExpense: async (id: string) => {
    set({ loading: true, error: null })
    try {
      await apiClient.delete(`/conciliations/expenses/${id}`)

      set((state) => ({
        conciliationExpenses: state.conciliationExpenses.filter((expense) => expense.id !== id),
        loading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error deleting conciliation expense",
        loading: false,
      })
    }
  },

  getConciliationExpensesByConciliation: async (conciliationId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<ConciliationExpense[]>(`/conciliations/${conciliationId}/expenses`)

      set({
        conciliationExpenses: response.data,
        loading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching conciliation expenses",
        loading: false,
      })
    }
  },

  fetchConciliationsAdvanced: async (companyId: string, filters: ConciliationFiltersDto) => {
    set({ loading: true, error: null })
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })

      const response = await apiClient.get<ConciliationPaginatedResponse>(
        `/conciliations/company/${companyId}/advanced?${params.toString()}`,
      )

      const { data, total, page, limit, totalPages } = response.data

      set({
        conciliations: data,
        pagination: { total, page, limit, totalPages },
        loading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching advanced conciliations",
        loading: false,
      })
    }
  },

  getConciliationStatistics: async (companyId: string, startDate?: string, endDate?: string) => {
    set({ loading: true, error: null })
    try {
      const params = new URLSearchParams()
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)

      const response = await apiClient.get<ConciliationStatistics>(
        `/conciliations/company/${companyId}/statistics?${params.toString()}`,
      )

      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching conciliation statistics",
        loading: false,
      })
      return null
    }
  },

  bulkCompleteConciliations: async (conciliationIds: string[]) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<BulkOperationResult[]>("/conciliations/bulk/complete", {
        conciliationIds,
      })
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error bulk completing conciliations",
        loading: false,
      })
      return []
    }
  },

  bulkAutoConciliate: async (conciliationIds: string[]) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<BulkOperationResult[]>("/conciliations/bulk/auto-conciliate", {
        conciliationIds,
      })
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error bulk auto-conciliating",
        loading: false,
      })
      return []
    }
  },

  exportConciliations: async (companyId: string, format: "csv" | "excel", filters: ConciliationFiltersDto) => {
    set({ loading: true, error: null })
    try {
      const params = new URLSearchParams()
      params.append("format", format)
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })

      const response = await apiClient.get<ExportConciliationsResult>(
        `/conciliations/company/${companyId}/export?${params.toString()}`,
      )

      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error exporting conciliations",
        loading: false,
      })
      return null
    }
  },

  getPendingDocumentsForConciliation: async (
    companyId: string,
    startDate?: string,
    endDate?: string,
    bankAccountId?: string,
  ) => {
    set({ loading: true, error: null })
    try {
      const params = new URLSearchParams()
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)
      if (bankAccountId) params.append("bankAccountId", bankAccountId)

      const response = await apiClient.get<PendingDocument[]>(
        `/conciliations/company/${companyId}/pending-documents?${params.toString()}`,
      )

      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching pending documents",
        loading: false,
      })
      return []
    }
  },

  getUnmatchedTransactions: async (companyId: string, startDate?: string, endDate?: string, bankAccountId?: string) => {
    set({ loading: true, error: null })
    try {
      const params = new URLSearchParams()
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)
      if (bankAccountId) params.append("bankAccountId", bankAccountId)

      const response = await apiClient.get<UnmatchedTransaction[]>(
        `/conciliations/company/${companyId}/unmatched-transactions?${params.toString()}`,
      )

      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching unmatched transactions",
        loading: false,
      })
      return []
    }
  },

  setCurrentConciliation: (conciliation: Conciliation | null) => {
    set({ currentConciliation: conciliation })
  },

  clearConciliations: () => {
    set({
      conciliations: [],
      currentConciliation: null,
      conciliationItems: [],
      conciliationExpenses: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
    })
  },

  clearError: () => {
    set({ error: null })
  },
}))

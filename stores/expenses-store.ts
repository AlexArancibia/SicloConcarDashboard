import { create } from "zustand"
import {
  Expense,
  ExpenseStatus,
  ExpensePaginatedResponse,
  CreateExpenseDto,
  UpdateExpenseDto,
  ReconcileExpenseDto,
  ExpenseFiltersDto,
  ExpenseStats,
  ExpenseSummary,
  PaginationDto,
} from "@/types"
import apiClient from "@/lib/axiosConfig"

interface ExpensesState {
  expenses: Expense[]
  loading: boolean
  error: string | null
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }

  // Métodos que coinciden exactamente con el service/controller
  fetchExpenses: (companyId: string, pagination?: PaginationDto) => Promise<void>
  createExpense: (createExpenseDto: CreateExpenseDto) => Promise<Expense | null>
  getExpenseById: (id: string) => Promise<Expense | null>
  updateExpense: (id: string, updateExpenseDto: UpdateExpenseDto) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  getExpensesByStatus: (companyId: string, status: ExpenseStatus) => Promise<Expense[]>
  reconcileExpense: (id: string, reconcileDto: ReconcileExpenseDto) => Promise<Expense | null>

  // Métodos adicionales para funcionalidades avanzadas
  fetchExpensesAdvanced: (companyId: string, filters: ExpenseFiltersDto) => Promise<void>
  getExpenseStats: (companyId: string, startDate?: string, endDate?: string) => Promise<ExpenseStats | null>
  getExpenseSummary: (companyId: string, startDate?: string, endDate?: string) => Promise<ExpenseSummary | null>
  searchExpenses: (companyId: string, searchTerm: string, pagination?: PaginationDto) => Promise<void>
  getExpensesByCategory: (companyId: string, category: string) => Promise<Expense[]>
  getRecurringExpenses: (companyId: string) => Promise<Expense[]>
  getTaxDeductibleExpenses: (companyId: string, startDate?: string, endDate?: string) => Promise<Expense[]>
  bulkUpdateStatus: (expenseIds: string[], status: ExpenseStatus, updatedById: string) => Promise<Expense[]>
  bulkReconcile: (
    reconciliations: Array<{ expenseId: string; documentId: string }>,
    reconciledById: string,
  ) => Promise<Expense[]>

  // Métodos utilitarios
  clearExpenses: () => void
  clearError: () => void
}

export const useExpensesStore = create<ExpensesState>((set, get) => ({
  expenses: [],
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },

  fetchExpenses: async (companyId: string, pagination: PaginationDto = {}) => {
    set({ loading: true, error: null })
    try {
      const { page = 1, limit = 10 } = pagination
      const response = await apiClient.get<ExpensePaginatedResponse>(
        `/expenses/company/${companyId}?page=${page}&limit=${limit}`,
      )

      const { data, total, totalPages } = response.data

      set({
        expenses: data,
        pagination: { total, page, limit, totalPages },
        loading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching expenses",
        loading: false,
      })
    }
  },

  createExpense: async (createExpenseDto: CreateExpenseDto) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<Expense>("/expenses", createExpenseDto)
      const newExpense = response.data

      set((state) => ({
        expenses: [newExpense, ...state.expenses],
        loading: false,
      }))

      return newExpense
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error creating expense",
        loading: false,
      })
      return null
    }
  },

  getExpenseById: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Expense>(`/expenses/${id}`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching expense",
        loading: false,
      })
      return null
    }
  },

  updateExpense: async (id: string, updateExpenseDto: UpdateExpenseDto) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.patch<Expense>(`/expenses/${id}`, updateExpenseDto)
      const updatedExpense = response.data

      set((state) => ({
        expenses: state.expenses.map((expense) => (expense.id === id ? updatedExpense : expense)),
        loading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error updating expense",
        loading: false,
      })
    }
  },

  deleteExpense: async (id: string) => {
    set({ loading: true, error: null })
    try {
      await apiClient.delete(`/expenses/${id}`)

      set((state) => ({
        expenses: state.expenses.filter((expense) => expense.id !== id),
        loading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error deleting expense",
        loading: false,
      })
    }
  },

  getExpensesByStatus: async (companyId: string, status: ExpenseStatus) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Expense[]>(`/expenses/company/${companyId}/status/${status}`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching expenses by status",
        loading: false,
      })
      return []
    }
  },

  reconcileExpense: async (id: string, reconcileDto: ReconcileExpenseDto) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.patch<Expense>(`/expenses/${id}/reconcile`, reconcileDto)
      const reconciledExpense = response.data

      set((state) => ({
        expenses: state.expenses.map((expense) => (expense.id === id ? reconciledExpense : expense)),
        loading: false,
      }))

      return reconciledExpense
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error reconciling expense",
        loading: false,
      })
      return null
    }
  },

  fetchExpensesAdvanced: async (companyId: string, filters: ExpenseFiltersDto) => {
    set({ loading: true, error: null })
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })

      const response = await apiClient.get<ExpensePaginatedResponse>(
        `/expenses/company/${companyId}/advanced?${params.toString()}`,
      )

      const { data, total, page, limit, totalPages } = response.data

      set({
        expenses: data,
        pagination: { total, page, limit, totalPages },
        loading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching advanced expenses",
        loading: false,
      })
    }
  },

  getExpenseStats: async (companyId: string, startDate?: string, endDate?: string) => {
    set({ loading: true, error: null })
    try {
      const params = new URLSearchParams()
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)

      const response = await apiClient.get<ExpenseStats>(`/expenses/company/${companyId}/stats?${params.toString()}`)

      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching expense stats",
        loading: false,
      })
      return null
    }
  },

  getExpenseSummary: async (companyId: string, startDate?: string, endDate?: string) => {
    set({ loading: true, error: null })
    try {
      const params = new URLSearchParams()
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)

      const response = await apiClient.get<ExpenseSummary>(
        `/expenses/company/${companyId}/summary?${params.toString()}`,
      )

      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching expense summary",
        loading: false,
      })
      return null
    }
  },

  searchExpenses: async (companyId: string, searchTerm: string, pagination: PaginationDto = {}) => {
    set({ loading: true, error: null })
    try {
      const { page = 1, limit = 10 } = pagination
      const response = await apiClient.get<ExpensePaginatedResponse>(
        `/expenses/company/${companyId}/search?term=${encodeURIComponent(searchTerm)}&page=${page}&limit=${limit}`,
      )

      const { data, total, totalPages } = response.data

      set({
        expenses: data,
        pagination: { total, page, limit, totalPages },
        loading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error searching expenses",
        loading: false,
      })
    }
  },

  getExpensesByCategory: async (companyId: string, category: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Expense[]>(`/expenses/company/${companyId}/category/${category}`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching expenses by category",
        loading: false,
      })
      return []
    }
  },

  getRecurringExpenses: async (companyId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Expense[]>(`/expenses/company/${companyId}/recurring`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching recurring expenses",
        loading: false,
      })
      return []
    }
  },

  getTaxDeductibleExpenses: async (companyId: string, startDate?: string, endDate?: string) => {
    set({ loading: true, error: null })
    try {
      const params = new URLSearchParams()
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)

      const response = await apiClient.get<Expense[]>(
        `/expenses/company/${companyId}/tax-deductible?${params.toString()}`,
      )

      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching tax deductible expenses",
        loading: false,
      })
      return []
    }
  },

  bulkUpdateStatus: async (expenseIds: string[], status: ExpenseStatus, updatedById: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.patch<Expense[]>("/expenses/bulk/status", {
        expenseIds,
        status,
        updatedById,
      })

      const updatedExpenses = response.data

      set((state) => ({
        expenses: state.expenses.map((expense) => {
          const updated = updatedExpenses.find((updated) => updated.id === expense.id)
          return updated || expense
        }),
        loading: false,
      }))

      return updatedExpenses
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error bulk updating expense status",
        loading: false,
      })
      return []
    }
  },

  bulkReconcile: async (reconciliations: Array<{ expenseId: string; documentId: string }>, reconciledById: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.patch<Expense[]>("/expenses/bulk/reconcile", {
        reconciliations,
        reconciledById,
      })

      const reconciledExpenses = response.data

      set((state) => ({
        expenses: state.expenses.map((expense) => {
          const reconciled = reconciledExpenses.find((reconciled) => reconciled.id === expense.id)
          return reconciled || expense
        }),
        loading: false,
      }))

      return reconciledExpenses
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error bulk reconciling expenses",
        loading: false,
      })
      return []
    }
  },

  clearExpenses: () => {
    set({ expenses: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } })
  },

  clearError: () => {
    set({ error: null })
  },
}))

import { create } from "zustand"
import type { Expense, ExpenseStatus, ExpenseType } from "@/types"
import apiClient from "@/lib/axiosConfig"

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

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

  // CRUD methods
  fetchExpenses: (companyId: string, page?: number, limit?: number) => Promise<void>
  createExpense: (expense: Omit<Expense, "id" | "createdAt" | "updatedAt">) => Promise<Expense | null>
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  getExpenseById: (id: string) => Promise<Expense | null>

  // Filtering methods
  getExpensesByStatus: (companyId: string, status: ExpenseStatus) => Promise<Expense[]>

  // Special operations
  reconcileExpense: (id: string, documentId: string, reconciledById: string) => Promise<boolean>

  // Utility methods
  getExpensesByAccount: (bankAccountId: string) => Expense[]
  getExpensesByType: (type: ExpenseType) => Expense[]
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

  fetchExpenses: async (companyId: string, page = 1, limit = 10) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<PaginatedResponse<Expense>>(
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

  createExpense: async (expenseData) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<Expense>("/expenses", expenseData)
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

  updateExpense: async (id: string, updates: Partial<Expense>) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.patch<Expense>(`/expenses/${id}`, updates)
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

  reconcileExpense: async (id: string, documentId: string, reconciledById: string) => {
    set({ loading: true, error: null })
    try {
      await apiClient.patch(`/expenses/${id}/reconcile`, {
        documentId,
        reconciledById,
      })

      // Update the expense in the local state
      set((state) => ({
        expenses: state.expenses.map((expense) =>
          expense.id === id
            ? {
                ...expense,
                documentId,
                status: "CONCILIATED" as ExpenseStatus,
                reconciledAt: new Date().toISOString(),
                reconciledById,
              }
            : expense,
        ),
        loading: false,
      }))

      return true
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error reconciling expense",
        loading: false,
      })
      return false
    }
  },

  getExpensesByAccount: (bankAccountId: string) => {
    return get().expenses.filter((expense) => expense.bankAccountId === bankAccountId)
  },

  getExpensesByType: (type: ExpenseType) => {
    return get().expenses.filter((expense) => expense.expenseType === type)
  },

  clearExpenses: () => {
    set({ expenses: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } })
  },

  clearError: () => {
    set({ error: null })
  },
}))

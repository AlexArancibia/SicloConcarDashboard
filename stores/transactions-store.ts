import { create } from "zustand"
import type { CreateTransactionDto, Transaction, TransactionStatus } from "@/types"
import apiClient from "@/lib/axiosConfig"

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface TransactionsState {
  transactions: Transaction[]
  loading: boolean
  error: string | null
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }

  // CRUD methods
  fetchTransactions: (companyId: string, page?: number, limit?: number) => Promise<void>
  createTransaction: (transaction: CreateTransactionDto) => Promise<Transaction | null>
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  getTransactionById: (id: string) => Promise<Transaction | null>

  // File operations
  importTransactions: (file: File, companyId: string, bankAccountId: string) => Promise<boolean>

  // Filtering methods
  getTransactionsByBankAccount: (bankAccountId: string) => Promise<Transaction[]>
  getTransactionsByStatus: (companyId: string, status: TransactionStatus) => Promise<Transaction[]>
  getTransactionsByDateRange: (companyId: string, startDate: string, endDate: string) => Promise<Transaction[]>

  // Utility methods
  clearTransactions: () => void
  clearError: () => void
}

export const useTransactionsStore = create<TransactionsState>((set, get) => ({
  transactions: [],
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },

  fetchTransactions: async (companyId: string, page = 1, limit = 10000) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<PaginatedResponse<Transaction>>(
        `/transactions/company/${companyId}?page=${page}&limit=${limit}`,
      )

      const { data, total, totalPages } = response.data

      set({
        transactions: data,
        pagination: { total, page, limit, totalPages },
        loading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching transactions",
        loading: false,
      })
    }
  },

  createTransaction: async (transactionData) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<Transaction>("/transactions", transactionData)
      const newTransaction = response.data

      set((state) => ({
        transactions: [newTransaction, ...state.transactions],
        loading: false,
      }))

      return newTransaction
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error creating transaction",
        loading: false,
      })
      return null
    }
  },

  updateTransaction: async (id: string, updates: Partial<Transaction>) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.patch<Transaction>(`/transactions/${id}`, updates)
      const updatedTransaction = response.data

      set((state) => ({
        transactions: state.transactions.map((transaction) =>
          transaction.id === id ? updatedTransaction : transaction,
        ),
        loading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error updating transaction",
        loading: false,
      })
    }
  },

  deleteTransaction: async (id: string) => {
    set({ loading: true, error: null })
    try {
      await apiClient.delete(`/transactions/${id}`)

      set((state) => ({
        transactions: state.transactions.filter((transaction) => transaction.id !== id),
        loading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error deleting transaction",
        loading: false,
      })
    }
  },

  getTransactionById: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Transaction>(`/transactions/${id}`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching transaction",
        loading: false,
      })
      return null
    }
  },

  importTransactions: async (file: File, companyId: string, bankAccountId: string) => {
    set({ loading: true, error: null })
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("companyId", companyId)
      formData.append("bankAccountId", bankAccountId)

      await apiClient.post("/transactions/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      set({ loading: false })
      return true
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error importing transactions",
        loading: false,
      })
      return false
    }
  },

  getTransactionsByBankAccount: async (bankAccountId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Transaction[]>(`/transactions/bank-account/${bankAccountId}`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching transactions by bank account",
        loading: false,
      })
      return []
    }
  },

  getTransactionsByStatus: async (companyId: string, status: TransactionStatus) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Transaction[]>(`/transactions/company/${companyId}/status/${status}`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching transactions by status",
        loading: false,
      })
      return []
    }
  },

  getTransactionsByDateRange: async (companyId: string, startDate: string, endDate: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Transaction[]>(
        `/transactions/company/${companyId}/date-range?startDate=${startDate}&endDate=${endDate}`,
      )
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching transactions by date range",
        loading: false,
      })
      return []
    }
  },

  clearTransactions: () => {
    set({ transactions: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } })
  },

  clearError: () => {
    set({ error: null })
  },
}))

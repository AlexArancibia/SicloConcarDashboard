import { create } from "zustand"
import type {
  Transaction,
  TransactionStatus,
  TransactionPaginatedResponse,
  CreateTransactionDto,
  UpdateTransactionDto,
  ImportTransactionsDto,
  ImportTransactionsResult,
  TransactionStats,
  PaginationDto,
} from "@/types/transactions"
import apiClient from "@/lib/axiosConfig"

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

  // Métodos que coinciden exactamente con el service/controller
  fetchTransactions: (companyId: string, pagination?: PaginationDto) => Promise<void>
  createTransaction: (createTransactionDto: CreateTransactionDto) => Promise<Transaction | null>
  importTransactions: (importDto: ImportTransactionsDto) => Promise<ImportTransactionsResult | null>
  getTransactionById: (id: string) => Promise<Transaction | null>
  updateTransaction: (id: string, updateTransactionDto: UpdateTransactionDto) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  getTransactionsByBankAccount: (bankAccountId: string) => Promise<Transaction[]>
  getTransactionsByStatus: (companyId: string, status: TransactionStatus) => Promise<Transaction[]>
  getTransactionsByDateRange: (companyId: string, startDate: string, endDate: string) => Promise<Transaction[]>

  // Métodos adicionales del service
  getTransactionStats: (companyId: string) => Promise<TransactionStats | null>
  searchTransactions: (companyId: string, searchTerm: string, pagination?: PaginationDto) => Promise<void>
  updateTransactionStatus: (id: string, status: TransactionStatus) => Promise<Transaction | null>

  // Métodos utilitarios
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

  fetchTransactions: async (companyId: string, pagination: PaginationDto = {}) => {
    set({ loading: true, error: null })
    try {
      const { page = 1, limit = 10 } = pagination
      const response = await apiClient.get<TransactionPaginatedResponse>(
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

  createTransaction: async (createTransactionDto: CreateTransactionDto) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<Transaction>("/transactions", createTransactionDto)
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

  importTransactions: async (importDto: ImportTransactionsDto) => {
    set({ loading: true, error: null })
    try {
      const formData = new FormData()
      formData.append("file", importDto.file)
      formData.append("companyId", importDto.companyId)
      formData.append("bankAccountId", importDto.bankAccountId)

      const response = await apiClient.post<ImportTransactionsResult>("/transactions/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error importing transactions",
        loading: false,
      })
      return null
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

  updateTransaction: async (id: string, updateTransactionDto: UpdateTransactionDto) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.patch<Transaction>(`/transactions/${id}`, updateTransactionDto)
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

  getTransactionStats: async (companyId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<TransactionStats>(`/transactions/company/${companyId}/stats`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching transaction stats",
        loading: false,
      })
      return null
    }
  },

  searchTransactions: async (companyId: string, searchTerm: string, pagination: PaginationDto = {}) => {
    set({ loading: true, error: null })
    try {
      const { page = 1, limit = 10 } = pagination
      const response = await apiClient.get<TransactionPaginatedResponse>(
        `/transactions/company/${companyId}/search?term=${encodeURIComponent(searchTerm)}&page=${page}&limit=${limit}`,
      )

      const { data, total, totalPages } = response.data

      set({
        transactions: data,
        pagination: { total, page, limit, totalPages },
        loading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error searching transactions",
        loading: false,
      })
    }
  },

  updateTransactionStatus: async (id: string, status: TransactionStatus) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.patch<Transaction>(`/transactions/${id}/status`, { status })
      const updatedTransaction = response.data

      set((state) => ({
        transactions: state.transactions.map((transaction) =>
          transaction.id === id ? updatedTransaction : transaction,
        ),
        loading: false,
      }))

      return updatedTransaction
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error updating transaction status",
        loading: false,
      })
      return null
    }
  },

  clearTransactions: () => {
    set({ transactions: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } })
  },

  clearError: () => {
    set({ error: null })
  },
}))

import { create } from "zustand"
import type { BankAccount } from "@/types"
import apiClient from "@/lib/axiosConfig"

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface BankAccountsState {
  bankAccounts: BankAccount[]
  activeBankAccounts: BankAccount[]
  loading: boolean
  error: string | null
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }

  // CRUD methods
  fetchBankAccounts: (companyId: string, page?: number, limit?: number) => Promise<void>
  fetchActiveBankAccounts: (companyId: string) => Promise<void>
  createBankAccount: (bankAccount: Omit<BankAccount, "id" | "createdAt" | "updatedAt">) => Promise<BankAccount | null>
  updateBankAccount: (id: string, bankAccount: Partial<BankAccount>) => Promise<void>
  deleteBankAccount: (id: string) => Promise<void>
  getBankAccountById: (id: string) => Promise<BankAccount | null>

  // Utility methods
  getAccountOptions: () => { label: string; value: string }[]
  clearBankAccounts: () => void
  clearError: () => void
}

export const useBankAccountsStore = create<BankAccountsState>((set, get) => ({
  bankAccounts: [],
  activeBankAccounts: [],
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },

  fetchBankAccounts: async (companyId: string, page = 1, limit = 10) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<PaginatedResponse<BankAccount>>(
        `/bank-accounts/company/${companyId}?page=${page}&limit=${limit}`,
      )

      const { data, total, totalPages } = response.data

      set({
        bankAccounts: data,
        pagination: { total, page, limit, totalPages },
        loading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching bank accounts",
        loading: false,
      })
    }
  },

  fetchActiveBankAccounts: async (companyId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<BankAccount[]>(`/bank-accounts/company/${companyId}/active`)

      set({
        activeBankAccounts: response.data,
        loading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching active bank accounts",
        loading: false,
      })
    }
  },

  createBankAccount: async (bankAccountData) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<BankAccount>("/bank-accounts", bankAccountData)
      const newBankAccount = response.data

      set((state) => ({
        bankAccounts: [newBankAccount, ...state.bankAccounts],
        activeBankAccounts: newBankAccount.isActive
          ? [newBankAccount, ...state.activeBankAccounts]
          : state.activeBankAccounts,
        loading: false,
      }))

      return newBankAccount
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error creating bank account",
        loading: false,
      })
      return null
    }
  },

  updateBankAccount: async (id: string, bankAccountData: Partial<BankAccount>) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.patch<BankAccount>(`/bank-accounts/${id}`, bankAccountData)
      const updatedBankAccount = response.data

      set((state) => ({
        bankAccounts: state.bankAccounts.map((account) => (account.id === id ? updatedBankAccount : account)),
        activeBankAccounts: state.activeBankAccounts.map((account) =>
          account.id === id ? updatedBankAccount : account,
        ),
        loading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error updating bank account",
        loading: false,
      })
    }
  },

  deleteBankAccount: async (id: string) => {
    set({ loading: true, error: null })
    try {
      await apiClient.delete(`/bank-accounts/${id}`)

      set((state) => ({
        bankAccounts: state.bankAccounts.filter((account) => account.id !== id),
        activeBankAccounts: state.activeBankAccounts.filter((account) => account.id !== id),
        loading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error deleting bank account",
        loading: false,
      })
    }
  },

  getBankAccountById: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<BankAccount>(`/bank-accounts/${id}`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching bank account",
        loading: false,
      })
      return null
    }
  },

  getAccountOptions: () => {
    const { activeBankAccounts } = get()
    return activeBankAccounts.map((account) => ({
      label: `${account.accountNumber} - ${account.bankName}`,
      value: account.id,
    }))
  },

  clearBankAccounts: () => {
    set({
      bankAccounts: [],
      activeBankAccounts: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
    })
  },

  clearError: () => {
    set({ error: null })
  },
}))

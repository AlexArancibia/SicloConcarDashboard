import { create } from "zustand"
import type { BankAccount, CreateBankAccountDto, UpdateBankAccountDto  } from "@/types/bank-accounts"
import apiClient from "@/lib/axiosConfig"
import { PaginationDto } from "@/types/common"
import { PaginatedResponse } from "@/types/suppliers"

interface BankAccountsState {
  bankAccounts: BankAccount[]
  loading: boolean
  error: string | null
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }

  // Métodos que coinciden exactamente con el service/controller
  fetchBankAccounts: (companyId: string, pagination?: PaginationDto) => Promise<void>
  createBankAccount: (createBankAccountDto: CreateBankAccountDto) => Promise<BankAccount | null>
  getBankAccountById: (id: string) => Promise<BankAccount | null>
  updateBankAccount: (id: string, updateBankAccountDto: UpdateBankAccountDto) => Promise<void>
  deleteBankAccount: (id: string) => Promise<void>
  getBankAccountsByCompany: (companyId: string) => Promise<BankAccount[]>

  // Métodos utilitarios
  clearBankAccounts: () => void
  clearError: () => void
}

export const useBankAccountsStore = create<BankAccountsState>((set, get) => ({
  bankAccounts: [], 
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },

  fetchBankAccounts: async (companyId: string, pagination: PaginationDto = {}) => {
    set({ loading: true, error: null })
    try {
      const { page = 1, limit = 10 } = pagination
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

  createBankAccount: async (createBankAccountDto: CreateBankAccountDto) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<BankAccount>("/bank-accounts", createBankAccountDto)
      const newBankAccount = response.data

      set((state) => ({
        bankAccounts: [newBankAccount, ...state.bankAccounts],
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

  updateBankAccount: async (id: string, updateBankAccountDto: UpdateBankAccountDto) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.patch<BankAccount>(`/bank-accounts/${id}`, updateBankAccountDto)
      const updatedBankAccount = response.data

      set((state) => ({
        bankAccounts: state.bankAccounts.map((account) => (account.id === id ? updatedBankAccount : account)),
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
        loading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error deleting bank account",
        loading: false,
      })
    }
  },

  getBankAccountsByCompany: async (companyId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<BankAccount[]>(`/bank-accounts/company/${companyId}/active`)
      set({ 
        bankAccounts: response.data,
        loading: false 
      })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching company bank accounts",
        loading: false,
      })
      return []
    }
  },

  clearBankAccounts: () => {
    set({ bankAccounts: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } })
  },

  clearError: () => {
    set({ error: null })
  },
}))

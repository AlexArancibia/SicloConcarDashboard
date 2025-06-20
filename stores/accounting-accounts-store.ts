import { create } from "zustand"
 
import apiClient from "@/lib/axiosConfig"
import { AccountingAccount, AccountingAccountHierarchy, AccountingAccountPaginatedResponse, CreateAccountingAccountDto, PaginationDto, UpdateAccountingAccountDto } from "@/types/accounting"

interface AccountingAccountsState {
  accountingAccounts: AccountingAccount[]
  accountingAccountHierarchy: AccountingAccountHierarchy[]
  loading: boolean
  error: string | null
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }

  // Métodos que coinciden exactamente con el service
  fetchAccountingAccounts: (companyId: string, pagination?: PaginationDto) => Promise<void>
  createAccountingAccount: (createAccountingAccountDto: CreateAccountingAccountDto) => Promise<AccountingAccount | null>
  getAccountingAccountById: (id: string) => Promise<AccountingAccount | null>
  updateAccountingAccount: (id: string, updateAccountingAccountDto: UpdateAccountingAccountDto) => Promise<void>
  deleteAccountingAccount: (id: string) => Promise<void>
  getAccountingAccountHierarchy: (companyId: string) => Promise<void>
  searchAccountingAccounts: (companyId: string, searchTerm: string, pagination?: PaginationDto) => Promise<void>

  // Métodos utilitarios
  clearAccountingAccounts: () => void
  clearError: () => void
}

export const useAccountingAccountsStore = create<AccountingAccountsState>((set, get) => ({
  accountingAccounts: [],
  accountingAccountHierarchy: [],
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },

  fetchAccountingAccounts: async (companyId: string, pagination: PaginationDto = {}) => {
    set({ loading: true, error: null })
    try {
      const { page = 1, limit = 10 } = pagination
      const response = await apiClient.get<AccountingAccountPaginatedResponse>(
        `/accounting/accounts/company/${companyId}?page=${page}&limit=${limit}`,
      )

      const { data, total, totalPages } = response.data

      set({
        accountingAccounts: data,
        pagination: { total, page, limit, totalPages },
        loading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching accounting accounts",
        loading: false,
      })
    }
  },

  createAccountingAccount: async (createAccountingAccountDto: CreateAccountingAccountDto) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<AccountingAccount>("/accounting/accounts", createAccountingAccountDto)
      const newAccount = response.data

      set((state) => ({
        accountingAccounts: [newAccount, ...state.accountingAccounts],
        loading: false,
      }))

      return newAccount
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error creating accounting account",
        loading: false,
      })
      return null
    }
  },

  getAccountingAccountById: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<AccountingAccount>(`/accounting/accounts/${id}`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching accounting account",
        loading: false,
      })
      return null
    }
  },

  updateAccountingAccount: async (id: string, updateAccountingAccountDto: UpdateAccountingAccountDto) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.patch<AccountingAccount>(
        `/accounting/accounts/${id}`,
        updateAccountingAccountDto,
      )
      const updatedAccount = response.data

      set((state) => ({
        accountingAccounts: state.accountingAccounts.map((account) => (account.id === id ? updatedAccount : account)),
        loading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error updating accounting account",
        loading: false,
      })
    }
  },

  deleteAccountingAccount: async (id: string) => {
    set({ loading: true, error: null })
    try {
      await apiClient.delete(`/accounting/accounts/${id}`)

      set((state) => ({
        accountingAccounts: state.accountingAccounts.filter((account) => account.id !== id),
        loading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error deleting accounting account",
        loading: false,
      })
    }
  },

  getAccountingAccountHierarchy: async (companyId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<AccountingAccountHierarchy[]>(
        `/accounting/accounts/company/${companyId}/hierarchy`,
      )

      set({
        accountingAccountHierarchy: response.data,
        loading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching accounting account hierarchy",
        loading: false,
      })
    }
  },

  searchAccountingAccounts: async (companyId: string, searchTerm: string, pagination: PaginationDto = {}) => {
    set({ loading: true, error: null })
    try {
      const { page = 1, limit = 10 } = pagination
      const response = await apiClient.get<AccountingAccountPaginatedResponse>(
        `/accounting/accounts/company/${companyId}/search?searchTerm=${encodeURIComponent(searchTerm)}&page=${page}&limit=${limit}`,
      )

      const { data, total, totalPages } = response.data

      set({
        accountingAccounts: data,
        pagination: { total, page, limit, totalPages },
        loading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error searching accounting accounts",
        loading: false,
      })
    }
  },

  clearAccountingAccounts: () => {
    set({
      accountingAccounts: [],
      accountingAccountHierarchy: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
    })
  },

  clearError: () => {
    set({ error: null })
  },
}))

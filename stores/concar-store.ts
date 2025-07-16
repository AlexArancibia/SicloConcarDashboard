import { create } from "zustand"
import apiClient from "@/lib/axiosConfig"
import type { ConcarDataItem, ConcarDataResponse, ConcarSummaryResponse } from "@/types/concar"

interface BankAccount {
  id: string
  accountNumber: string
  accountType: string
  currency: string
  alias?: string
  description?: string
  bank: {
    id: string
    name: string
    code: string
  }
}

interface Currency {
  code: string
  name: string
  symbol: string
}

interface ConcarFilters {
  startDate: string
  endDate: string
  bankAccountId?: string
  conciliationType?: "DOCUMENTS" | "DETRACTIONS"
  conciliationStatus?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  transactionType?: string
  documentType?: "INVOICE" | "CREDIT_NOTE" | "DEBIT_NOTE" | "RECEIPT" | "PURCHASE_ORDER" | "CONTRACT"
  supplierId?: string
  page?: number
  limit?: number
}

interface ConcarStore {
  // Data State
  data: ConcarDataItem[]
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }

  // Summary State
  summary: ConcarSummaryResponse | null
  summaryLoading: boolean
  summaryError: string | null

  // Bank Accounts State
  bankAccounts: BankAccount[]
  bankAccountsLoading: boolean
  bankAccountsError: string | null

  // Currencies State
  currencies: Currency[]
  currenciesLoading: boolean
  currenciesError: string | null

  // Export State
  exportLoading: boolean
  exportProgress: number

  // Current Filters
  currentFilters: ConcarFilters | null

  // Actions
  fetchConcarData: (companyId: string, filters: ConcarFilters) => Promise<void>
  fetchConcarSummary: (
    companyId: string,
    filters: Pick<ConcarFilters, "startDate" | "endDate" | "bankAccountId" | "conciliationType" | "conciliationStatus">,
  ) => Promise<void>
  fetchBankAccountsByCurrency: (companyId: string, currency: string) => Promise<void>
  fetchCurrenciesWithBankAccounts: (companyId: string) => Promise<void>
  fetchConcarDataByCurrency: (
    companyId: string,
    currency: string,
    filters: Omit<ConcarFilters, "bankAccountId">,
  ) => Promise<void>
  exportConcarData: (companyId: string, filters: ConcarFilters, format?: "csv" | "excel") => Promise<void>

  // Utility Actions
  clearErrors: () => void
  resetExportState: () => void
  setCurrentFilters: (filters: ConcarFilters) => void
  clearData: () => void
}

export const useConcarStore = create<ConcarStore>((set, get) => ({
  // Initial State
  data: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },

  summary: null,
  summaryLoading: false,
  summaryError: null,

  bankAccounts: [],
  bankAccountsLoading: false,
  bankAccountsError: null,

  currencies: [],
  currenciesLoading: false,
  currenciesError: null,

  exportLoading: false,
  exportProgress: 0,

  currentFilters: null,

  // Actions
  fetchConcarData: async (companyId, filters) => {
    set({ loading: true, error: null, currentFilters: filters })

    try {
      const response = await apiClient.get<ConcarDataResponse>(`/concar/company/${companyId}`, {
        params: filters,
      })

      set({
        data: response.data.data,
        pagination: response.data.pagination,
        loading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || "Error al cargar datos CONCAR",
        loading: false,
      })
    }
  },

  fetchConcarSummary: async (companyId, filters) => {
    set({ summaryLoading: true, summaryError: null })

    try {
      const response = await apiClient.get<ConcarSummaryResponse>(`/concar/company/${companyId}/summary`, {
        params: filters,
      })

      set({
        summary: response.data,
        summaryLoading: false,
      })
    } catch (error: any) {
      set({
        summaryError: error.response?.data?.message || error.message || "Error al cargar resumen CONCAR",
        summaryLoading: false,
      })
    }
  },

  fetchBankAccountsByCurrency: async (companyId, currency) => {
    set({ bankAccountsLoading: true, bankAccountsError: null })

    try {
      const response = await apiClient.get<BankAccount[]>(`/concar/company/${companyId}/bank-accounts/${currency}`)

      set({
        bankAccounts: response.data,
        bankAccountsLoading: false,
      })
    } catch (error: any) {
      set({
        bankAccountsError: error.response?.data?.message || error.message || "Error al cargar cuentas bancarias",
        bankAccountsLoading: false,
      })
    }
  },

  fetchCurrenciesWithBankAccounts: async (companyId) => {
    set({ currenciesLoading: true, currenciesError: null })

    try {
      const response = await apiClient.get<Currency[]>(`/concar/company/${companyId}/currencies`)

      set({
        currencies: response.data,
        currenciesLoading: false,
      })
    } catch (error: any) {
      set({
        currenciesError: error.response?.data?.message || error.message || "Error al cargar monedas",
        currenciesLoading: false,
      })
    }
  },

  fetchConcarDataByCurrency: async (companyId, currency, filters) => {
    set({ loading: true, error: null, currentFilters: { ...filters, bankAccountId: undefined } })

    try {
      const response = await apiClient.get<ConcarDataResponse>(`/concar/company/${companyId}/currency/${currency}`, {
        params: filters,
      })

      set({
        data: response.data.data,
        pagination: response.data.pagination,
        loading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || "Error al cargar datos CONCAR por moneda",
        loading: false,
      })
    }
  },

  exportConcarData: async (companyId, filters, format = "excel") => {
    set({ exportLoading: true, exportProgress: 0 })

    try {
      const response = await apiClient.get(`/concar/company/${companyId}/export`, {
        params: { ...filters, format },
        responseType: "blob",
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            set({ exportProgress: progress })
          }
        },
      })

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `concar_export_${companyId}_${filters.startDate}_${filters.endDate}.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      set({ exportProgress: 100 })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || "Error al exportar datos CONCAR",
      })
    } finally {
      set({ exportLoading: false })
    }
  },

  // Utility Actions
  clearErrors: () => {
    set({
      error: null,
      summaryError: null,
      bankAccountsError: null,
      currenciesError: null,
    })
  },

  resetExportState: () => {
    set({ exportLoading: false, exportProgress: 0 })
  },

  setCurrentFilters: (filters) => {
    set({ currentFilters: filters })
  },

  clearData: () => {
    set({
      data: [],
      summary: null,
      bankAccounts: [],
      currencies: [],
      pagination: {
        page: 1,
        limit: 100,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
      currentFilters: null,
    })
  },
}))

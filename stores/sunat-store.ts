import { create } from "zustand"
import apiClient from "@/lib/axiosConfig"
import type {
  SunatRhe,
  SunatInvoice,
  SunatStats,
  CreateSunatRheDto,
  CreateSunatInvoiceDto,
  UpdateSunatRheDto,
  UpdateSunatInvoiceDto,
} from "@/types/sunat"
import { PaginatedResponse } from "@/types/suppliers"

interface SunatStore {
  // RHE State
  rheRecords: SunatRhe[]
  rheLoading: boolean
  rheError: string | null

  // Invoice State
  invoices: SunatInvoice[]
  invoicesLoading: boolean
  invoicesError: string | null

  // Stats State
  stats: SunatStats | null
  statsLoading: boolean

  // Import State
  importLoading: boolean
  importProgress: number

  // RHE Actions
  fetchSunatRhe: (companyId: string, page?: number, limit?: number) => Promise<void>
  createSunatRhe: (data: CreateSunatRheDto) => Promise<SunatRhe>
  getSunatRheById: (id: string) => Promise<SunatRhe>
  updateSunatRhe: (id: string, data: UpdateSunatRheDto) => Promise<SunatRhe>
  deleteSunatRhe: (id: string) => Promise<void>
  getSunatRheByPeriod: (companyId: string, startDate: string, endDate: string) => Promise<SunatRhe[]>
  searchSunatRhe: (companyId: string, searchTerm: string, page?: number, limit?: number) => Promise<void>
  importSunatRheFromFile: (companyId: string, userId: string, file: File) => Promise<void>

  // Invoice Actions
  fetchSunatInvoices: (companyId: string, page?: number, limit?: number) => Promise<void>
  createSunatInvoice: (data: CreateSunatInvoiceDto) => Promise<SunatInvoice>
  getSunatInvoiceById: (id: string) => Promise<SunatInvoice>
  updateSunatInvoice: (id: string, data: UpdateSunatInvoiceDto) => Promise<SunatInvoice>
  deleteSunatInvoice: (id: string) => Promise<void>
  getSunatInvoicesByPeriod: (companyId: string, period: string) => Promise<SunatInvoice[]>
  searchSunatInvoices: (companyId: string, searchTerm: string, page?: number, limit?: number) => Promise<void>
  importSunatInvoicesFromFile: (companyId: string, userId: string, file: File) => Promise<void>

  // Stats Actions
  getSunatStats: (companyId: string) => Promise<void>

  // Utility Actions
  clearErrors: () => void
  resetImportState: () => void
}

export const useSunatStore = create<SunatStore>((set, get) => ({
  // Initial State
  rheRecords: [],
  rheLoading: false,
  rheError: null,
  invoices: [],
  invoicesLoading: false,
  invoicesError: null,
  stats: null,
  statsLoading: false,
  importLoading: false,
  importProgress: 0,

  // RHE Actions
  fetchSunatRhe: async (companyId: string, page = 1, limit = 25) => {
    set({ rheLoading: true, rheError: null })
    try {
      const response = await apiClient.get<PaginatedResponse<SunatRhe>>(`/sunat/rhe/company/${companyId}`, {
        params: { page, limit },
      })
      set({ rheRecords: response.data.data, rheLoading: false })
    } catch (error: any) {
      set({
        rheError: error.response?.data?.message || error.message || "Error al cargar registros RHE",
        rheLoading: false,
      })
    }
  },

  createSunatRhe: async (data: CreateSunatRheDto) => {
    try {
      const response = await apiClient.post<SunatRhe>("/sunat/rhe", data)
      const newRecord = response.data
      set((state) => ({ rheRecords: [newRecord, ...state.rheRecords] }))
      return newRecord
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Error al crear registro RHE")
    }
  },

  getSunatRheById: async (id: string) => {
    try {
      const response = await apiClient.get<SunatRhe>(`/sunat/rhe/${id}`)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Error al obtener registro RHE")
    }
  },

  updateSunatRhe: async (id: string, data: UpdateSunatRheDto) => {
    try {
      const response = await apiClient.patch<SunatRhe>(`/sunat/rhe/${id}`, data)
      const updatedRecord = response.data
      set((state) => ({
        rheRecords: state.rheRecords.map((record) => (record.id === id ? updatedRecord : record)),
      }))
      return updatedRecord
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Error al actualizar registro RHE")
    }
  },

  deleteSunatRhe: async (id: string) => {
    try {
      await apiClient.delete(`/sunat/rhe/${id}`)
      set((state) => ({
        rheRecords: state.rheRecords.filter((record) => record.id !== id),
      }))
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Error al eliminar registro RHE")
    }
  },

  getSunatRheByPeriod: async (companyId: string, startDate: string, endDate: string) => {
    try {
      const response = await apiClient.get<SunatRhe[]>(`/sunat/rhe/company/${companyId}/period`, {
        params: { startDate, endDate },
      })
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Error al obtener registros RHE por período")
    }
  },

  searchSunatRhe: async (companyId: string, searchTerm: string, page = 1, limit = 25) => {
    set({ rheLoading: true, rheError: null })
    try {
      const response = await apiClient.get<PaginatedResponse<SunatRhe>>(`/sunat/rhe/company/${companyId}/search`, {
        params: { searchTerm, page, limit },
      })
      set({ rheRecords: response.data.data, rheLoading: false })
    } catch (error: any) {
      set({
        rheError: error.response?.data?.message || "Error al buscar registros RHE",
        rheLoading: false,
      })
    }
  },

  importSunatRheFromFile: async (companyId: string, userId: string, file: File) => {
    set({ importLoading: true, importProgress: 0 })
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("companyId", companyId)
      formData.append("userId", userId)

      await apiClient.post("/sunat/rhe/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            set({ importProgress: progress })
          }
        },
      })

      set({ importProgress: 100 })
      // Refresh the records after import
      await get().fetchSunatRhe(companyId)
    } catch (error: any) {
      set({ rheError: error.response?.data?.message || "Error al importar archivo RHE" })
    } finally {
      set({ importLoading: false })
    }
  },

  // Invoice Actions
  fetchSunatInvoices: async (companyId: string, page = 1, limit = 25) => {
    set({ invoicesLoading: true, invoicesError: null })
    try {
      const response = await apiClient.get<PaginatedResponse<SunatInvoice>>(`/sunat/invoices/company/${companyId}`, {
        params: { page, limit },
      })
      set({ invoices: response.data.data, invoicesLoading: false })
    } catch (error: any) {
      set({
        invoicesError: error.response?.data?.message || "Error al cargar facturas",
        invoicesLoading: false,
      })
    }
  },

  createSunatInvoice: async (data: CreateSunatInvoiceDto) => {
    try {
      const response = await apiClient.post<SunatInvoice>("/sunat/invoices", data)
      const newInvoice = response.data
      set((state) => ({ invoices: [newInvoice, ...state.invoices] }))
      return newInvoice
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Error al crear factura")
    }
  },

  getSunatInvoiceById: async (id: string) => {
    try {
      const response = await apiClient.get<SunatInvoice>(`/sunat/invoices/${id}`)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Error al obtener factura")
    }
  },

  updateSunatInvoice: async (id: string, data: UpdateSunatInvoiceDto) => {
    try {
      const response = await apiClient.patch<SunatInvoice>(`/sunat/invoices/${id}`, data)
      const updatedInvoice = response.data
      set((state) => ({
        invoices: state.invoices.map((invoice) => (invoice.id === id ? updatedInvoice : invoice)),
      }))
      return updatedInvoice
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Error al actualizar factura")
    }
  },

  deleteSunatInvoice: async (id: string) => {
    try {
      await apiClient.delete(`/sunat/invoices/${id}`)
      set((state) => ({
        invoices: state.invoices.filter((invoice) => invoice.id !== id),
      }))
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Error al eliminar factura")
    }
  },

  getSunatInvoicesByPeriod: async (companyId: string, period: string) => {
    try {
      const response = await apiClient.get<SunatInvoice[]>(`/sunat/invoices/company/${companyId}/period/${period}`)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Error al obtener facturas por período")
    }
  },

  searchSunatInvoices: async (companyId: string, searchTerm: string, page = 1, limit = 25) => {
    set({ invoicesLoading: true, invoicesError: null })
    try {
      const response = await apiClient.get<PaginatedResponse<SunatInvoice>>(
        `/sunat/invoices/company/${companyId}/search`,
        {
          params: { searchTerm, page, limit },
        },
      )
      set({ invoices: response.data.data, invoicesLoading: false })
    } catch (error: any) {
      set({
        invoicesError: error.response?.data?.message || "Error al buscar facturas",
        invoicesLoading: false,
      })
    }
  },

  importSunatInvoicesFromFile: async (companyId: string, userId: string, file: File) => {
    set({ importLoading: true, importProgress: 0 })
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("companyId", companyId)
      formData.append("userId", userId)

      await apiClient.post("/sunat/invoices/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            set({ importProgress: progress })
          }
        },
      })

      set({ importProgress: 100 })
      // Refresh the invoices after import
      await get().fetchSunatInvoices(companyId)
    } catch (error: any) {
      set({ invoicesError: error.response?.data?.message || "Error al importar archivo de facturas" })
    } finally {
      set({ importLoading: false })
    }
  },

  // Stats Actions
  getSunatStats: async (companyId: string) => {
    set({ statsLoading: true })
    try {
      const response = await apiClient.get<SunatStats>(`/sunat/company/${companyId}/stats`)
      set({ stats: response.data, statsLoading: false })
    } catch (error: any) {
      set({ statsLoading: false })
      console.error("Error al cargar estadísticas:", error)
    }
  },

  // Utility Actions
  clearErrors: () => {
    set({ rheError: null, invoicesError: null })
  },

  resetImportState: () => {
    set({ importLoading: false, importProgress: 0 })
  },
}))

import { create } from "zustand"
import type {
  Supplier,
  SupplierStatus,
  SupplierType,
  PaginationDto,
  PaginatedResponse,
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierStats,
} from "@/types/suppliers"
import apiClient from "@/lib/axiosConfig"

interface SuppliersState {
  suppliers: Supplier[]
  loading: boolean
  error: string | null
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }

  // Métodos que coinciden exactamente con el service
  fetchSuppliers: (companyId: string, pagination?: PaginationDto) => Promise<void>
  createSupplier: (createSupplierDto: CreateSupplierDto) => Promise<Supplier | null>
  getSupplierById: (id: string) => Promise<Supplier | null>
  updateSupplier: (id: string, updateSupplierDto: UpdateSupplierDto) => Promise<void>
  deleteSupplier: (id: string) => Promise<void>
  getSupplierByDocument: (companyId: string, documentNumber: string) => Promise<Supplier | null>
  getSuppliersByStatus: (companyId: string, status: SupplierStatus) => Promise<Supplier[]>
  updateSupplierStatus: (id: string, status: SupplierStatus) => Promise<Supplier | null>
  getSupplierStats: (companyId: string) => Promise<SupplierStats | null>
  searchSuppliers: (companyId: string, searchTerm: string, pagination?: PaginationDto) => Promise<void>
  getSuppliersByStatusPaginated: (
    companyId: string,
    status: SupplierStatus,
    pagination?: PaginationDto,
  ) => Promise<void>
  getSuppliersByTypePaginated: (
    companyId: string,
    supplierType: SupplierType,
    pagination?: PaginationDto,
  ) => Promise<void>

  // Métodos utilitarios
  clearSuppliers: () => void
  clearError: () => void
}

export const useSuppliersStore = create<SuppliersState>((set, get) => ({
  suppliers: [],
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },

  fetchSuppliers: async (companyId: string, pagination: PaginationDto = {}) => {
    set({ loading: true, error: null })
    try {
      const { page = 1, limit = 10 } = pagination
      const response = await apiClient.get<PaginatedResponse<Supplier>>(
        `/suppliers/company/${companyId}?page=${page}&limit=${limit}`,
      )

      const { data, total, totalPages } = response.data

      set({
        suppliers: data,
        pagination: { total, page, limit, totalPages },
        loading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching suppliers",
        loading: false,
      })
    }
  },

  createSupplier: async (createSupplierDto: CreateSupplierDto) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<Supplier>("/suppliers", createSupplierDto)
      const newSupplier = response.data

      set((state) => ({
        suppliers: [newSupplier, ...state.suppliers],
        loading: false,
      }))

      return newSupplier
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error creating supplier",
        loading: false,
      })
      return null
    }
  },

  getSupplierById: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Supplier>(`/suppliers/${id}`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching supplier",
        loading: false,
      })
      return null
    }
  },

  updateSupplier: async (id: string, updateSupplierDto: UpdateSupplierDto) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.patch<Supplier>(`/suppliers/${id}`, updateSupplierDto)
      const updatedSupplier = response.data

      set((state) => ({
        suppliers: state.suppliers.map((supplier) => (supplier.id === id ? updatedSupplier : supplier)),
        loading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error updating supplier",
        loading: false,
      })
    }
  },

  deleteSupplier: async (id: string) => {
    set({ loading: true, error: null })
    try {
      await apiClient.delete(`/suppliers/${id}`)

      set((state) => ({
        suppliers: state.suppliers.filter((supplier) => supplier.id !== id),
        loading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error deleting supplier",
        loading: false,
      })
    }
  },

  getSupplierByDocument: async (companyId: string, documentNumber: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Supplier>(`/suppliers/company/${companyId}/document/${documentNumber}`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching supplier by document",
        loading: false,
      })
      return null
    }
  },

  getSuppliersByStatus: async (companyId: string, status: SupplierStatus) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Supplier[]>(`/suppliers/company/${companyId}/status/${status}`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching suppliers by status",
        loading: false,
      })
      return []
    }
  },

  updateSupplierStatus: async (id: string, status: SupplierStatus) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.patch<Supplier>(`/suppliers/${id}/status`, { status })
      const updatedSupplier = response.data

      set((state) => ({
        suppliers: state.suppliers.map((supplier) => (supplier.id === id ? updatedSupplier : supplier)),
        loading: false,
      }))

      return updatedSupplier
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error updating supplier status",
        loading: false,
      })
      return null
    }
  },

  getSupplierStats: async (companyId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<SupplierStats>(`/suppliers/company/${companyId}/stats`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching supplier stats",
        loading: false,
      })
      return null
    }
  },

  searchSuppliers: async (companyId: string, searchTerm: string, pagination: PaginationDto = {}) => {
    set({ loading: true, error: null })
    try {
      const { page = 1, limit = 10 } = pagination
      const response = await apiClient.get<PaginatedResponse<Supplier>>(
        `/suppliers/company/${companyId}/search?term=${encodeURIComponent(searchTerm)}&page=${page}&limit=${limit}`,
      )

      const { data, total, totalPages } = response.data

      set({
        suppliers: data,
        pagination: { total, page, limit, totalPages },
        loading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error searching suppliers",
        loading: false,
      })
    }
  },

  getSuppliersByStatusPaginated: async (companyId: string, status: SupplierStatus, pagination: PaginationDto = {}) => {
    set({ loading: true, error: null })
    try {
      const { page = 1, limit = 10 } = pagination
      const response = await apiClient.get<PaginatedResponse<Supplier>>(
        `/suppliers/company/${companyId}/status/${status}/paginated?page=${page}&limit=${limit}`,
      )

      const { data, total, totalPages } = response.data

      set({
        suppliers: data,
        pagination: { total, page, limit, totalPages },
        loading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching suppliers by status",
        loading: false,
      })
    }
  },

  getSuppliersByTypePaginated: async (
    companyId: string,
    supplierType: SupplierType,
    pagination: PaginationDto = {},
  ) => {
    set({ loading: true, error: null })
    try {
      const { page = 1, limit = 10 } = pagination
      const response = await apiClient.get<PaginatedResponse<Supplier>>(
        `/suppliers/company/${companyId}/type/${supplierType}/paginated?page=${page}&limit=${limit}`,
      )

      const { data, total, totalPages } = response.data

      set({
        suppliers: data,
        pagination: { total, page, limit, totalPages },
        loading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching suppliers by type",
        loading: false,
      })
    }
  },

  clearSuppliers: () => {
    set({ suppliers: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } })
  },

  clearError: () => {
    set({ error: null })
  },
}))

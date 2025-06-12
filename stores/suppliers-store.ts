import { create } from "zustand"
import type { Supplier } from "@/types"
import apiClient from "@/lib/axiosConfig"

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

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

  // CRUD methods
  fetchSuppliers: (companyId: string, page?: number, limit?: number) => Promise<void>
  createSupplier: (supplier: Omit<Supplier, "id" | "createdAt" | "updatedAt">) => Promise<Supplier | null>
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<void>
  deleteSupplier: (id: string) => Promise<void>
  getSupplierById: (id: string) => Promise<Supplier | null>
  getSupplierByDocument: (companyId: string, documentNumber: string) => Promise<Supplier | null>

  // Utility methods
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

  fetchSuppliers: async (companyId: string, page = 1, limit = 10) => {
    set({ loading: true, error: null })
    try {
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

  createSupplier: async (supplierData) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<Supplier>("/suppliers", supplierData)
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

  updateSupplier: async (id: string, supplierData: Partial<Supplier>) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.patch<Supplier>(`/suppliers/${id}`, supplierData)
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

  clearSuppliers: () => {
    set({ suppliers: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } })
  },

  clearError: () => {
    set({ error: null })
  },
}))

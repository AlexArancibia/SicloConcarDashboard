import { create } from "zustand"
import type { Bank, PaginationDto, PaginatedResponse } from "@/types"
import apiClient from "@/lib/axiosConfig"

interface BanksState {
  banks: Bank[]
  loading: boolean
  error: string | null
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }

  // Solo métodos de fetch (no update ni delete como especificaste)
  fetchBanks: (pagination?: PaginationDto) => Promise<void>
  getActiveBanks: () => Promise<Bank[]>
  searchBanks: (searchTerm: string, pagination?: PaginationDto) => Promise<void>
  getBankByCode: (code: string) => Promise<Bank | null>
  getBankById: (id: string) => Promise<Bank | null>

  // Métodos utilitarios
  clearBanks: () => void
  clearError: () => void
}

export const useBanksStore = create<BanksState>((set, get) => ({
  banks: [],
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },

  fetchBanks: async (pagination: PaginationDto = {}) => {
    set({ loading: true, error: null })
    try {
      const { page = 1, limit = 10 } = pagination
      const response = await apiClient.get<PaginatedResponse<Bank>>(`/banks?page=${page}&limit=${limit}`)

      const { data, total, totalPages } = response.data

      set({
        banks: data,
        pagination: { total, page, limit, totalPages },
        loading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching banks",
        loading: false,
      })
    }
  },

  getActiveBanks: async () => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Bank[]>("/banks/active")
      set({
        banks: response.data,
        loading: false,
      })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching active banks",
        loading: false,
      })
      return []
    }
  },

  searchBanks: async (searchTerm: string, pagination: PaginationDto = {}) => {
    set({ loading: true, error: null })
    try {
      const { page = 1, limit = 10 } = pagination
      const response = await apiClient.get<PaginatedResponse<Bank>>(
        `/banks/search?q=${encodeURIComponent(searchTerm)}&page=${page}&limit=${limit}`,
      )

      const { data, total, totalPages } = response.data

      set({
        banks: data,
        pagination: { total, page, limit, totalPages },
        loading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error searching banks",
        loading: false,
      })
    }
  },

  getBankByCode: async (code: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Bank>(`/banks/code/${code}`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching bank by code",
        loading: false,
      })
      return null
    }
  },

  getBankById: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Bank>(`/banks/${id}`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching bank by id",
        loading: false,
      })
      return null
    }
  },

  clearBanks: () => {
    set({ banks: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } })
  },

  clearError: () => {
    set({ error: null })
  },
}))

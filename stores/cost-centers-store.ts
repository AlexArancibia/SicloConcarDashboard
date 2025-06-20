import { create } from "zustand"
 
import apiClient from "@/lib/axiosConfig"
import { CostCenter, CostCenterHierarchy, CostCenterPaginatedResponse, CreateCostCenterDto, PaginationDto, UpdateCostCenterDto } from "@/types/accounting"

interface CostCentersState {
  costCenters: CostCenter[]
  costCenterHierarchy: CostCenterHierarchy[]
  loading: boolean
  error: string | null
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }

  // Métodos que coinciden exactamente con el service
  fetchCostCenters: (companyId: string, pagination?: PaginationDto) => Promise<void>
  createCostCenter: (createCostCenterDto: CreateCostCenterDto) => Promise<CostCenter | null>
  getCostCenterById: (id: string) => Promise<CostCenter | null>
  updateCostCenter: (id: string, updateCostCenterDto: UpdateCostCenterDto) => Promise<void>
  deleteCostCenter: (id: string) => Promise<void>
  getCostCenterHierarchy: (companyId: string) => Promise<void>
  searchCostCenters: (companyId: string, searchTerm: string, pagination?: PaginationDto) => Promise<void>

  // Métodos utilitarios
  clearCostCenters: () => void
  clearError: () => void
}

export const useCostCentersStore = create<CostCentersState>((set, get) => ({
  costCenters: [],
  costCenterHierarchy: [],
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },

  fetchCostCenters: async (companyId: string, pagination: PaginationDto = {}) => {
    set({ loading: true, error: null })
    try {
      const { page = 1, limit = 10 } = pagination
      const response = await apiClient.get<CostCenterPaginatedResponse>(
        `/accounting/cost-centers/company/${companyId}?page=${page}&limit=${limit}`,
      )

      const { data, total, totalPages } = response.data

      set({
        costCenters: data,
        pagination: { total, page, limit, totalPages },
        loading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching cost centers",
        loading: false,
      })
    }
  },

  createCostCenter: async (createCostCenterDto: CreateCostCenterDto) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<CostCenter>("/accounting/cost-centers", createCostCenterDto)
      const newCostCenter = response.data

      set((state) => ({
        costCenters: [newCostCenter, ...state.costCenters],
        loading: false,
      }))

      return newCostCenter
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error creating cost center",
        loading: false,
      })
      return null
    }
  },

  getCostCenterById: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<CostCenter>(`/accounting/cost-centers/${id}`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching cost center",
        loading: false,
      })
      return null
    }
  },

  updateCostCenter: async (id: string, updateCostCenterDto: UpdateCostCenterDto) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.patch<CostCenter>(`/accounting/cost-centers/${id}`, updateCostCenterDto)
      const updatedCostCenter = response.data

      set((state) => ({
        costCenters: state.costCenters.map((costCenter) => (costCenter.id === id ? updatedCostCenter : costCenter)),
        loading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error updating cost center",
        loading: false,
      })
    }
  },

  deleteCostCenter: async (id: string) => {
    set({ loading: true, error: null })
    try {
      await apiClient.delete(`/accounting/cost-centers/${id}`)

      set((state) => ({
        costCenters: state.costCenters.filter((costCenter) => costCenter.id !== id),
        loading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error deleting cost center",
        loading: false,
      })
    }
  },

  getCostCenterHierarchy: async (companyId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<CostCenterHierarchy[]>(
        `/accounting/cost-centers/company/${companyId}/hierarchy`,
      )

      set({
        costCenterHierarchy: response.data,
        loading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching cost center hierarchy",
        loading: false,
      })
    }
  },

  searchCostCenters: async (companyId: string, searchTerm: string, pagination: PaginationDto = {}) => {
    set({ loading: true, error: null })
    try {
      const { page = 1, limit = 10 } = pagination
      const response = await apiClient.get<CostCenterPaginatedResponse>(
        `/accounting/cost-centers/company/${companyId}/search?searchTerm=${encodeURIComponent(searchTerm)}&page=${page}&limit=${limit}`,
      )

      const { data, total, totalPages } = response.data

      set({
        costCenters: data,
        pagination: { total, page, limit, totalPages },
        loading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error searching cost centers",
        loading: false,
      })
    }
  },

  clearCostCenters: () => {
    set({
      costCenters: [],
      costCenterHierarchy: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
    })
  },

  clearError: () => {
    set({ error: null })
  },
}))

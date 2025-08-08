import { create } from "zustand"
import apiClient from "@/lib/axiosConfig"
import {
  AccountingEntry,
  AccountingEntryPaginatedResponse,
  CreateAccountingEntryDto,
  UpdateAccountingEntryDto,
} from "@/types/accounting"
import type { PaginationDto } from "@/types/common"

interface AccountingEntriesState {
  entries: AccountingEntry[]
  loading: boolean
  error: string | null
  pagination: { total: number; page: number; limit: number; totalPages: number }

  fetchEntries: (companyId: string, pagination?: PaginationDto) => Promise<void>
  fetchEntriesByConciliation: (
    companyId: string,
    conciliationId: string,
    pagination?: PaginationDto
  ) => Promise<void>
  createEntry: (dto: CreateAccountingEntryDto) => Promise<AccountingEntry | null>
  getById: (id: string) => Promise<AccountingEntry | null>
  updateEntry: (id: string, dto: UpdateAccountingEntryDto) => Promise<AccountingEntry | null>

  clear: () => void
  clearError: () => void
}

export const useAccountingEntriesStore = create<AccountingEntriesState>((set, get) => ({
  entries: [],
  loading: false,
  error: null,
  pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },

  fetchEntries: async (companyId: string, pagination: PaginationDto = {}) => {
    set({ loading: true, error: null })
    try {
      const { page = 1, limit = 10 } = pagination
      const res = await apiClient.get<AccountingEntryPaginatedResponse>(
        `/accounting-entries/company/${companyId}?page=${page}&limit=${limit}`,
      )
      const { data, total, totalPages } = res.data
      set({ entries: data, pagination: { total, page, limit, totalPages }, loading: false })
    } catch (e: any) {
      set({ error: e.response?.data?.message || "Error fetching accounting entries", loading: false })
    }
  },

  fetchEntriesByConciliation: async (companyId, conciliationId, pagination: PaginationDto = {}) => {
    set({ loading: true, error: null })
    try {
      const { page = 1, limit = 10 } = pagination
      const res = await apiClient.get<AccountingEntryPaginatedResponse>(
        `/accounting-entries/company/${companyId}?page=${page}&limit=${limit}&conciliationId=${conciliationId}`
      )
      const { data, total, totalPages } = res.data
      set({ entries: data, pagination: { total, page, limit, totalPages }, loading: false })
    } catch (e: any) {
      set({ error: e.response?.data?.message || "Error fetching accounting entries", loading: false })
    }
  },

  createEntry: async (dto: CreateAccountingEntryDto) => {
    set({ loading: true, error: null })
    try {
      const res = await apiClient.post<AccountingEntry>(`/accounting-entries`, dto)
      const entry = res.data
      set((s) => ({ entries: [entry, ...s.entries], loading: false }))
      return entry
    } catch (e: any) {
      set({ error: e.response?.data?.message || "Error creating accounting entry", loading: false })
      return null
    }
  },

  getById: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const res = await apiClient.get<AccountingEntry>(`/accounting-entries/${id}`)
      set({ loading: false })
      return res.data
    } catch (e: any) {
      set({ error: e.response?.data?.message || "Error fetching accounting entry", loading: false })
      return null
    }
  },

  updateEntry: async (id: string, dto: UpdateAccountingEntryDto) => {
    set({ loading: true, error: null })
    try {
      const res = await apiClient.patch<AccountingEntry>(`/accounting-entries/${id}`, dto)
      const entry = res.data
      set((s) => ({ entries: s.entries.map((e) => (e.id === id ? entry : e)), loading: false }))
      return entry
    } catch (e: any) {
      set({ error: e.response?.data?.message || "Error updating accounting entry", loading: false })
      return null
    }
  },

  clear: () => set({ entries: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } }),
  clearError: () => set({ error: null }),
}))


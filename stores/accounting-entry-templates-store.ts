import { create } from "zustand"
import apiClient from "@/lib/axiosConfig"
import {
  AccountingEntryTemplate,
  CreateAccountingEntryTemplateDto,
  UpdateAccountingEntryTemplateDto,
} from "@/types/accounting"

interface TemplatesState {
  templates: AccountingEntryTemplate[]
  loading: boolean
  error: string | null

  fetchTemplates: (companyId: string) => Promise<void>
  createTemplate: (companyId: string, dto: CreateAccountingEntryTemplateDto) => Promise<AccountingEntryTemplate | null>
  getTemplateById: (id: string) => Promise<AccountingEntryTemplate | null>
  updateTemplate: (id: string, dto: UpdateAccountingEntryTemplateDto) => Promise<AccountingEntryTemplate | null>
  removeTemplate: (id: string) => Promise<boolean>

  clear: () => void
  clearError: () => void
}

export const useAccountingEntryTemplatesStore = create<TemplatesState>((set, get) => ({
  templates: [],
  loading: false,
  error: null,

  fetchTemplates: async (companyId: string) => {
    set({ loading: true, error: null })
    try {
      const res = await apiClient.get<AccountingEntryTemplate[]>(`/accounting-entry-templates/company/${companyId}`)
      set({ templates: res.data, loading: false })
    } catch (e: any) {
      set({ error: e.response?.data?.message || "Error fetching templates", loading: false })
    }
  },

  createTemplate: async (companyId, dto) => {
    set({ loading: true, error: null })
    try {
      const res = await apiClient.post<AccountingEntryTemplate>(`/accounting-entry-templates/company/${companyId}`, dto)
      const t = res.data
      set((s) => ({ templates: [t, ...s.templates], loading: false }))
      return t
    } catch (e: any) {
      set({ error: e.response?.data?.message || "Error creating template", loading: false })
      return null
    }
  },

  getTemplateById: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const res = await apiClient.get<AccountingEntryTemplate>(`/accounting-entry-templates/${id}`)
      set({ loading: false })
      return res.data
    } catch (e: any) {
      set({ error: e.response?.data?.message || "Error fetching template", loading: false })
      return null
    }
  },

  updateTemplate: async (id, dto) => {
    set({ loading: true, error: null })
    try {
      const res = await apiClient.patch<AccountingEntryTemplate>(`/accounting-entry-templates/${id}`, dto)
      const updated = res.data
      set((s) => ({ templates: s.templates.map((t) => (t.id === id ? updated : t)), loading: false }))
      return updated
    } catch (e: any) {
      set({ error: e.response?.data?.message || "Error updating template", loading: false })
      return null
    }
  },

  removeTemplate: async (id) => {
    set({ loading: true, error: null })
    try {
      await apiClient.delete(`/accounting-entry-templates/${id}`)
      set((s) => ({ templates: s.templates.filter((t) => t.id !== id), loading: false }))
      return true
    } catch (e: any) {
      set({ error: e.response?.data?.message || "Error deleting template", loading: false })
      return false
    }
  },

  clear: () => set({ templates: [] }),
  clearError: () => set({ error: null }),
}))


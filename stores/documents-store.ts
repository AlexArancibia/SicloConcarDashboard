import { create } from "zustand"
import type { Document, DocumentStatus, DocumentType } from "@/types"
import apiClient from "@/lib/axiosConfig"

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface DocumentsState {
  documents: Document[]
  loading: boolean
  error: string | null
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }

  // CRUD methods
  fetchDocuments: (companyId: string, page?: number, limit?: number) => Promise<void>
  createDocument: (document: Omit<Document, "id" | "createdAt" | "updatedAt">) => Promise<Document | null>
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
  getDocumentById: (id: string) => Promise<Document | null>

  // File operations
  uploadXmlDocument: (file: File, companyId: string, createdById: string) => Promise<Document | null>

  // Utility methods
  getDocumentsByStatus: (status: DocumentStatus) => Document[]
  getDocumentsByType: (type: DocumentType) => Document[]
  getDocumentsBySupplier: (supplierId: string) => Promise<Document[]>
  getDocumentsByDateRange: (companyId: string, startDate: string, endDate: string) => Promise<Document[]>

  // SUNAT operations
  validateWithSunat: (documentId: string) => Promise<boolean>
  generateCdr: (documentId: string) => Promise<string | null>

  // Clear methods
  clearDocuments: () => void
  clearError: () => void
}

export const useDocumentsStore = create<DocumentsState>((set, get) => ({
  documents: [],
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },

  fetchDocuments: async (companyId: string, page = 1, limit = 10) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<PaginatedResponse<Document>>(
        `/documents/company/${companyId}?page=${page}&limit=${limit}`,
      )

      const { data, total, totalPages } = response.data

      set({
        documents: data,
        pagination: { total, page, limit, totalPages },
        loading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching documents",
        loading: false,
      })
    }
  },

  createDocument: async (documentData) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<Document>("/documents", documentData)
      const newDocument = response.data

      set((state) => ({
        documents: [newDocument, ...state.documents],
        loading: false,
      }))

      return newDocument
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error creating document",
        loading: false,
      })
      return null
    }
  },

  updateDocument: async (id: string, updates: Partial<Document>) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.patch<Document>(`/documents/${id}`, updates)
      const updatedDocument = response.data

      set((state) => ({
        documents: state.documents.map((doc) => (doc.id === id ? updatedDocument : doc)),
        loading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error updating document",
        loading: false,
      })
    }
  },

  deleteDocument: async (id: string) => {
    set({ loading: true, error: null })
    try {
      await apiClient.delete(`/documents/${id}`)

      set((state) => ({
        documents: state.documents.filter((doc) => doc.id !== id),
        loading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error deleting document",
        loading: false,
      })
    }
  },

  getDocumentById: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Document>(`/documents/${id}`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching document",
        loading: false,
      })
      return null
    }
  },

  uploadXmlDocument: async (file: File, companyId: string, createdById: string) => {
    set({ loading: true, error: null })
    try {
      const formData = new FormData()
      formData.append("xmlFile", file)
      formData.append("companyId", companyId)
      formData.append("createdById", createdById)

      const response = await apiClient.post<Document>("/documents/upload-xml", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      const newDocument = response.data

      set((state) => ({
        documents: [newDocument, ...state.documents],
        loading: false,
      }))

      return newDocument
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error uploading XML document",
        loading: false,
      })
      return null
    }
  },

  getDocumentsByStatus: (status: DocumentStatus) => {
    return get().documents.filter((doc) => doc.status === status)
  },

  getDocumentsByType: (type: DocumentType) => {
    return get().documents.filter((doc) => doc.documentType === type)
  },

  getDocumentsBySupplier: async (supplierId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Document[]>(`/documents/supplier/${supplierId}`)
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching documents by supplier",
        loading: false,
      })
      return []
    }
  },

  getDocumentsByDateRange: async (companyId: string, startDate: string, endDate: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Document[]>(
        `/documents/company/${companyId}/date-range?startDate=${startDate}&endDate=${endDate}`,
      )
      set({ loading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching documents by date range",
        loading: false,
      })
      return []
    }
  },

  validateWithSunat: async (documentId: string) => {
    set({ loading: true, error: null })
    try {
      await apiClient.post(`/documents/${documentId}/validate-sunat`)
      set({ loading: false })
      return true
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error validating with SUNAT",
        loading: false,
      })
      return false
    }
  },

  generateCdr: async (documentId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<{ cdrPath: string }>(`/documents/${documentId}/generate-cdr`)
      set({ loading: false })
      return response.data.cdrPath
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error generating CDR",
        loading: false,
      })
      return null
    }
  },

  clearDocuments: () => {
    set({ documents: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } })
  },

  clearError: () => {
    set({ error: null })
  },
}))
